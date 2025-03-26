-- Create the database
CREATE DATABASE tasktracker;

-- Connect to the database
\c tasktracker

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_hours FLOAT NOT NULL,
    actual_hours FLOAT DEFAULT 0,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started',
    bas_account VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time entries table
CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration FLOAT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BAS Account table (Swedish standard chart of accounts)
CREATE TABLE bas_accounts (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT
);

-- Insert default BAS accounts (subset of the standard)
INSERT INTO bas_accounts (id, name, category, description) VALUES
-- Class 1: Assets (Tillgångar)
('1000', 'Immateriella anläggningstillgångar', 'Tillgångar', 'Intangible fixed assets'),
('1220', 'Inventarier och verktyg', 'Tillgångar', 'Equipment and tools'),
('1510', 'Kundfordringar', 'Tillgångar', 'Trade receivables'),
('1910', 'Kassa', 'Tillgångar', 'Cash'),
('1920', 'Plusgiro', 'Tillgångar', 'Postal giro'),
('1930', 'Företagskonto/checkkonto', 'Tillgångar', 'Business account/checking account'),
('1940', 'Övriga bankkonton', 'Tillgångar', 'Other bank accounts'),

-- Class 2: Liabilities and Equity (Skulder och eget kapital)
('2010', 'Eget kapital', 'Eget kapital', 'Equity'),
('2440', 'Leverantörsskulder', 'Skulder', 'Accounts payable'),
('2510', 'Skatteskulder', 'Skulder', 'Tax liabilities'),
('2610', 'Utgående moms', 'Skulder', 'Output VAT'),
('2640', 'Ingående moms', 'Skulder', 'Input VAT'),
('2710', 'Personalskatt', 'Skulder', 'Personnel tax'),
('2730', 'Sociala avgifter', 'Skulder', 'Social security contributions'),

-- Class 3: Income (Intäkter)
('3010', 'Försäljning inom Sverige', 'Intäkter', 'Sales within Sweden'),
('3020', 'Försäljning utom Sverige', 'Intäkter', 'Sales outside Sweden'),
('3740', 'Öresavrundning', 'Intäkter', 'Rounding'),

-- Class 4: Expenses - Materials and Goods (Utgifter/Inköp)
('4010', 'Inköp material och varor', 'Kostnader', 'Purchase of materials and goods'),
('4990', 'Lagerförändring', 'Kostnader', 'Inventory change'),

-- Class 5: Expenses - Other External Costs (Övriga externa kostnader)
('5010', 'Lokalhyra', 'Kostnader', 'Premises rent'),
('5020', 'El', 'Kostnader', 'Electricity'),
('5060', 'Städning och renhållning', 'Kostnader', 'Cleaning and waste disposal'),
('5410', 'Förbrukningsinventarier', 'Kostnader', 'Consumable equipment'),
('5420', 'Programvaror', 'Kostnader', 'Software'),
('5800', 'Resekostnader', 'Kostnader', 'Travel expenses'),
('5910', 'Annonsering', 'Kostnader', 'Advertising'),
('5930', 'Reklamtrycksaker', 'Kostnader', 'Promotional prints'),
('5990', 'Övriga kostnader', 'Kostnader', 'Other costs'),

-- Class 6: Other External Expenses (Övriga externa kostnader)
('6070', 'Representation', 'Kostnader', 'Representation'),
('6110', 'Kontorsmaterial', 'Kostnader', 'Office supplies'),
('6200', 'Telekommunikation', 'Kostnader', 'Telecommunications'),
('6310', 'Företagsförsäkringar', 'Kostnader', 'Business insurance'),
('6410', 'Styrelsearvoden', 'Kostnader', 'Board fees'),
('6530', 'Redovisningstjänster', 'Kostnader', 'Accounting services'),
('6560', 'Avgifter till branschorganisationer', 'Kostnader', 'Fees to industry organizations'),
('6570', 'Bankkostnader', 'Kostnader', 'Bank fees'),

-- Class 7: Personnel Expenses (Personalkostnader)
('7010', 'Löner', 'Personal', 'Salaries'),
('7090', 'Förändring semesterlöneskuld', 'Personal', 'Change in vacation pay liability'),
('7210', 'Löner tjänstemän', 'Personal', 'Salaries office staff'),
('7220', 'Löner kollektivanställda', 'Personal', 'Salaries collective agreement employees'),
('7310', 'Kontanta ersättningar', 'Personal', 'Cash benefits'),
('7330', 'Bilersättningar', 'Personal', 'Car allowances'),
('7510', 'Arbetsgivaravgifter', 'Personal', 'Employer contributions'),
('7610', 'Utbildning', 'Personal', 'Education'),
('7690', 'Övriga personalkostnader', 'Personal', 'Other personnel costs'),

-- Class 8: Financial and Other Items (Finansiella och andra poster)
('8310', 'Ränteintäkter', 'Finansiellt', 'Interest income'),
('8410', 'Räntekostnader', 'Finansiellt', 'Interest expenses'),
('8811', 'Avsättning periodiseringsfond', 'Finansiellt', 'Allocation to tax allocation reserve'),
('8910', 'Skatt på årets resultat', 'Finansiellt', 'Tax on profit for the year');

-- Create indexes for better performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_bas_account ON tasks(bas_account);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
