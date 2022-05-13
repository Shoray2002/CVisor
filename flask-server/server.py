from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/members', methods=['GET'])
def members():
    return jsonify({'members': ['John', 'Mary', 'Bob']})


@app.route('/members', methods=['POST'])
def add_member():
    member = request.json
    print(member)
    return jsonify({'members': ['John', 'Mary', 'Bob', member['name']]})


if __name__ == '__main__':
    app.run(debug=True)
