from flask import Flask
import subprocess

app = Flask(__name__)

@app.route('/start-jarvis')
def start_jarvis():
    subprocess.Popen(["python", "jarvis.py"])
    return "Jarvis started"

if __name__ == "__main__":
    app.run(port=5000)
