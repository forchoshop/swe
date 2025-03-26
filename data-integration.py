# bas_integration.py - BAS Account Import and Validation

import csv
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("bas_integration.log"), logging.StreamHandler()]
)
logger = logging.getLogger('bas_integration')

# Database connection setup (same as app.py)
def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        database=os.environ.get('DB_NAME', 'tasktracker'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', 'postgres'),
        port=os.environ.get('DB_PORT', '5432')
    )
    conn.autocommit = True
    return conn

def import_bas_accounts_from_csv(file_path):
    """
    Import BAS accounts from a standard CSV file
    Expected format: account_id, account_name, category, description
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # First, set existing accounts to inactive
        cur.execute("ALTER TABLE bas_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
        cur.execute("UPDATE bas_accounts SET is_active = FALSE")
        
        # Read and import accounts
        imported_count = 0
        with open(file_path, 'r', encoding='utf-8') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            
            # Skip header row
            next(csv_reader, None)
            
            for row in csv_reader:
                if len(row) >= 3:  # Ensure we have at least id, name, category
                    account_id = row[0].strip()
                    account_name = row[1].strip()
                    category = row[2].strip() if len(row) > 2 else ''
                    description = row[3].strip() if len(row) > 3 else ''
                    
                    # Upsert the account (insert or update if exists)
                    cur.execute(
                        """
                        INSERT INTO bas_accounts (id, name, category, description, is_active) 
                        VALUES (%s, %s, %s, %s, TRUE)
                        ON CONFLICT (id) DO UPDATE 
                        SET name = EXCLUDED.name,
                            category = EXCLUDED.category,
                            description = EXCLUDED.description,
                            is_active = TRUE
                        """,
                        (account_id, account_name, category, description)
                    )
                    imported_count += 1
        
        conn.commit()
        logger.info(f"Successfully imported {imported_count} BAS accounts")
        
        # Get count of active accounts
        cur.execute("SELECT COUNT(*) FROM bas_accounts WHERE is_active = TRUE")
        active_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": f"Successfully imported {imported_count} BAS accounts. {active_count} accounts are now active.",
            "imported_count": imported_count,
            "active_count": active_count
        }
        
    except Exception as e:
        logger.error(f"Error importing BAS accounts: {str(e)}")
        return {
            "success": False,
            "message": f"Error importing BAS accounts: {str(e)}",
            "imported_count": 0
        }

def validate_bas_account(account_id):
    """
    Validate if a BAS account exists and is active in the system
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "SELECT * FROM bas_accounts WHERE id = %s AND is_active = TRUE",
            (account_id,)
        )
        
        account = cur.fetchone()
        cur.close()
        conn.close()
        
        if account:
            return {
                "valid": True,
                "account": account
            }
        else:
            return {
                "valid": False,
                "message": f"BAS account {account_id} does not exist or is inactive"
            }
            
    except Exception as e:
        logger.error(f"Error validating BAS account: {str(e)}")
        return {
            "valid": False,
            "message": f"Error validating BAS account: {str(e)}"
        }

def generate_bas_account_report(start_date=None, end_date=None):
    """
    Generate a report of time spent by BAS account
    Optionally filter by date range
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                b.id as account_id,
                b.name as account_name,
                b.category,
                SUM(t.actual_hours) as total_hours,
                COUNT(DISTINCT t.id) as task_count
            FROM tasks t
            JOIN bas_accounts b ON t.bas_account = b.id
            WHERE b.is_active = TRUE
        """
        
        params = []
        
        if start_date and end_date:
            query += " AND t.start_date BETWEEN %s AND %s"
            params.extend([start_date, end_date])
        elif start_date:
            query += " AND t.start_date >= %s"
            params.append(start_date)
        elif end_date:
            query += " AND t.start_date <= %s"
            params.append(end_date)
            
        query += """
            GROUP BY b.id, b.name, b.category
            ORDER BY b.category, b.id
        """
        
        cur.execute(query, params)
        results = cur.fetchall()
        
        # Calculate totals by category
        category_totals = {}
        for row in results:
            category = row['category']
            hours = row['total_hours'] or 0
            
            if category not in category_totals:
                category_totals[category] = 0
                
            category_totals[category] += hours
        
        # Add category totals to the response
        categories = [{"category": cat, "total_hours": hours} for cat, hours in category_totals.items()]
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "accounts": results,
            "categories": categories,
            "total_hours": sum(r['total_hours'] or 0 for r in results)
        }
        
    except Exception as e:
        logger.error(f"Error generating BAS account report: {str(e)}")
        return {
            "success": False,
            "message": f"Error generating BAS account report: {str(e)}"
        }

def export_bas_account_data_for_accounting(month=None, year=None):
    """
    Export data in a format suitable for importing into accounting systems
    Optionally filter by month and year
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                t.id as task_id,
                t.title as task_name,
                t.bas_account,
                b.name as account_name,
                t.actual_hours,
                to_char(t.start_date, 'YYYY-MM-DD') as start_date,
                t.status
            FROM tasks t
            JOIN bas_accounts b ON t.bas_account = b.id
            WHERE t.actual_hours > 0
        """
        
        params = []
        
        if month and year:
            query += " AND EXTRACT(MONTH FROM t.start_date) = %s AND EXTRACT(YEAR FROM t.start_date) = %s"
            params.extend([month, year])
        elif month:
            query += " AND EXTRACT(MONTH FROM t.start_date) = %s"
            params.append(month)
        elif year:
            query += " AND EXTRACT(YEAR FROM t.start_date) = %s"
            params.append(year)
            
        query += " ORDER BY t.start_date"
        
        cur.execute(query, params)
        tasks = cur.fetchall()
        
        # Format data for accounting export
        export_data = []
        for task in tasks:
            export_data.append({
                "account_number": task['bas_account'],
                "account_name": task['account_name'],
                "description": task['task_name'],
                "hours": task['actual_hours'],
                "date": task['start_date']
            })
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "export_data": export_data,
            "total_records": len(export_data),
            "total_hours": sum(task['hours'] for task in export_data)
        }
        
    except Exception as e:
        logger.error(f"Error exporting accounting data: {str(e)}")
        return {
            "success": False,
            "message": f"Error exporting accounting data: {str(e)}"
        }

# Example usage
if __name__ == "__main__":
    # Example: Import BAS accounts
    # result = import_bas_accounts_from_csv("bas_accounts.csv")
    # print(json.dumps(result, indent=2))
    
    # Example: Generate report
    report = generate_bas_account_report()
    print(json.dumps(report, indent=2))
