# app.py - Main Flask Application
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database connection setup
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

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create tasks table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            estimated_hours FLOAT NOT NULL,
            actual_hours FLOAT DEFAULT 0,
            start_date DATE NOT NULL,
            status VARCHAR(20) DEFAULT 'not_started',
            bas_account VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create time_entries table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS time_entries (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            duration FLOAT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create bas_accounts table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS bas_accounts (
            id VARCHAR(10) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            description TEXT
        )
    ''')
    
    # Insert some default BAS accounts if they don't exist
    cur.execute("SELECT COUNT(*) FROM bas_accounts")
    count = cur.fetchone()[0]
    
    if count == 0:
        bas_accounts = [
            ('1930', 'Företagskonto / checkräkningskonto', 'Tillgångar', 'Company account/checking account'),
            ('5010', 'Lokalhyra', 'Kostnader', 'Premises rent'),
            ('5800', 'Resekostnader', 'Kostnader', 'Travel expenses'),
            ('6200', 'Telekommunikation', 'Kostnader', 'Telecommunications'),
            ('7010', 'Löner', 'Personal', 'Salaries')
        ]
        
        for account in bas_accounts:
            cur.execute(
                "INSERT INTO bas_accounts (id, name, category, description) VALUES (%s, %s, %s, %s)",
                account
            )
    
    cur.close()
    conn.close()

# Initialize database on application startup
@app.before_first_request
def before_first_request():
    init_db()

# API Routes
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM tasks ORDER BY start_date DESC')
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        '''INSERT INTO tasks (title, description, estimated_hours, start_date, bas_account) 
           VALUES (%s, %s, %s, %s, %s) RETURNING *''',
        (data['title'], data['description'], data['estimated_hours'], 
         data['start_date'], data['bas_account'])
    )
    
    new_task = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify(new_task), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        '''UPDATE tasks 
           SET title = %s, description = %s, estimated_hours = %s, 
               start_date = %s, status = %s, bas_account = %s,
               actual_hours = %s
           WHERE id = %s RETURNING *''',
        (data['title'], data['description'], data['estimated_hours'], 
         data['start_date'], data['status'], data['bas_account'],
         data['actual_hours'], task_id)
    )
    
    updated_task = cur.fetchone()
    cur.close()
    conn.close()
    
    if updated_task:
        return jsonify(updated_task)
    return jsonify({"error": "Task not found"}), 404

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('DELETE FROM tasks WHERE id = %s RETURNING id', (task_id,))
    deleted = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if deleted:
        return jsonify({"message": "Task deleted successfully"})
    return jsonify({"error": "Task not found"}), 404

@app.route('/api/time-entries', methods=['GET'])
def get_time_entries():
    task_id = request.args.get('task_id')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if task_id:
        cur.execute('SELECT * FROM time_entries WHERE task_id = %s ORDER BY start_time DESC', (task_id,))
    else:
        cur.execute('SELECT * FROM time_entries ORDER BY start_time DESC')
        
    entries = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(entries)

@app.route('/api/time-entries', methods=['POST'])
def create_time_entry():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Insert the time entry
    cur.execute(
        '''INSERT INTO time_entries (task_id, start_time, end_time, duration, notes) 
           VALUES (%s, %s, %s, %s, %s) RETURNING *''',
        (data['task_id'], data['start_time'], data['end_time'], 
         data['duration'], data.get('notes', ''))
    )
    
    new_entry = cur.fetchone()
    
    # Update task's actual hours
    cur.execute(
        '''UPDATE tasks 
           SET actual_hours = actual_hours + %s,
               status = CASE WHEN status = 'not_started' THEN 'in_progress' ELSE status END
           WHERE id = %s''',
        (data['duration'], data['task_id'])
    )
    
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(new_entry), 201

@app.route('/api/bas-accounts', methods=['GET'])
def get_bas_accounts():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM bas_accounts ORDER BY id')
    accounts = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(accounts)

@app.route('/api/reports/task-status', methods=['GET'])
def task_status_report():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute('''
        SELECT status, COUNT(*) as count
        FROM tasks
        GROUP BY status
    ''')
    
    result = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify(result)

@app.route('/api/reports/time-by-account', methods=['GET'])
def time_by_account_report():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute('''
        SELECT b.id, b.name, b.category, SUM(t.actual_hours) as total_hours
        FROM tasks t
        JOIN bas_accounts b ON t.bas_account = b.id
        GROUP BY b.id, b.name, b.category
        HAVING SUM(t.actual_hours) > 0
        ORDER BY total_hours DESC
    ''')
    
    result = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify(result)

@app.route('/api/reports/time-accuracy', methods=['GET'])
def time_accuracy_report():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute('''
        SELECT 
            id, 
            title,
            estimated_hours,
            actual_hours,
            CASE 
                WHEN estimated_hours > 0 AND actual_hours > 0 
                THEN 100 - LEAST(100, ABS((actual_hours / estimated_hours * 100) - 100))
                ELSE NULL
            END AS accuracy_percentage
        FROM tasks
        WHERE estimated_hours > 0 AND actual_hours > 0
        ORDER BY accuracy_percentage DESC
    ''')
    
    result = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify(result)

# Run the application
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
