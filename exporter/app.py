import os
import io
import psycopg2
import pandas as pd
from flask import Flask, request, send_file

app = Flask(__name__)

def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASS']
    )
    return conn

@app.route('/export', methods=['GET'])
def export_data():
    user_id = request.args.get('user_id')
    if not user_id:
        return "Missing user_id", 400

    try:
        conn = get_db_connection()
        
        transactions = pd.read_sql(f"SELECT * FROM transactions WHERE user_id = {user_id} ORDER BY date DESC", conn)
        bills = pd.read_sql(f"SELECT * FROM bills WHERE user_id = {user_id}", conn)
        savings = pd.read_sql(f"SELECT * FROM savings_plans WHERE user_id = {user_id}", conn)
        
        conn.close()

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            transactions.to_excel(writer, sheet_name='Transactions', index=False)
            bills.to_excel(writer, sheet_name='Bills', index=False)
            savings.to_excel(writer, sheet_name='Savings', index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='finance_data.xlsx'
        )

    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
