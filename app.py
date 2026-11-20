from flask import Flask, jsonify, send_from_directory
import yfinance as yf
import os

app = Flask(__name__, static_folder='public')

@app.route('/api/regime', methods=['GET'])
def get_vt_regime():
    try:
        ticker = yf.Ticker('VT')
        # Fetch max weekly data to calculate accurate All-Time High (ATH) and 50-week SMA
        hist = ticker.history(period="max", interval="1wk")

        if hist.empty or len(hist) < 52:
            return jsonify({'error': 'Insufficient historical data for VT'}), 500

        # Drop any incomplete/NaN rows
        hist = hist.dropna(subset=['Close', 'High'])

        ath = float(hist['High'].max())
        current_price = float(hist['Close'].iloc[-1])
        drop_from_ath = max(0.0, ((ath - current_price) / ath) * 100)

        # Calculate Weekly SMAs
        close = hist['Close']
        sma10 = float(close.rolling(10).mean().iloc[-1])
        sma15_curr = float(close.rolling(15).mean().iloc[-1])
        sma15_prev = float(close.rolling(15).mean().iloc[-2])
        sma20 = float(close.rolling(20).mean().iloc[-1])
        sma30 = float(close.rolling(30).mean().iloc[-1])
        sma50 = float(close.rolling(50).mean().iloc[-1])

        # Condition checks
        cond_10_below_20 = sma10 < sma20
        cond_30_below_50 = sma30 < sma50
        cond_15_sloping_down = sma15_curr < sma15_prev

        satellite_triggered = cond_10_below_20
        core_triggered = cond_10_below_20 and cond_30_below_50 and cond_15_sloping_down

        return jsonify({
            'symbol': 'VT',
            'price': round(current_price, 2),
            'ath': round(ath, 2),
            'drop_from_ath': round(drop_from_ath, 2),
            'smas': {
                'sma10': round(sma10, 2),
                'sma15_curr': round(sma15_curr, 2),
                'sma15_prev': round(sma15_prev, 2),
                'sma20': round(sma20, 2),
                'sma30': round(sma30, 2),
                'sma50': round(sma50, 2),
            },
            'conditions': {
                'sma10_below_20': cond_10_below_20,
                'sma30_below_50': cond_30_below_50,
                'sma15_down_slope': cond_15_sloping_down
            },
            'satellite_triggered': satellite_triggered,
            'core_triggered': core_triggered
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
