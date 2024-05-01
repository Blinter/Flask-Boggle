from flask import Flask, request, render_template, session, jsonify
from boggle import Boggle
# from flask_debugtoolbar import DebugToolbarExtension

boggle_game = Boggle()

app = Flask(__name__)
app.config['SECRET_KEY'] = "oh-so-secresew"
# debug = DebugToolbarExtension(app)


@app.route('/', methods=['GET'])
def make_board():
    """Initializes the session Board and populates the session list with the
    letters. Sends the current games played along with the high score.
    We will reset the submission list upon a new browser refresh, since
    player score will not persist across browser refresh.
    Players may reset their timer and score by refreshing the page."""
    if not session.get('board', False):
        session['board'] = boggle_game.make_board(7)
    session.pop('submitted', None)
    session.modified = True
    return render_template("boggle.html",
                           game=session.get('board', None),
                           games_played=session.get('games_played', 1),
                           high_score=session.get('high_score', 0))


@app.route('/validate', methods=['POST'])
def validate():
    """Accepts client validation for game completion and word checks
    Completes high score checks and increments games played as the player
    reaches countdown automatically."""
    word = request.form.get('word', False)
    if not word:
        """Game completion server processes highest score, incrementing 
        games played this counts as a games played incrementer.
        session objects are popped and emptied."""
        session['games_played'] = session.get('games_played', 1) + 1
        new_score = int(request.json['score'])
        if new_score > int(session.get('high_score', 0)):
            session['high_score'] = new_score
            session.modified = True
            return "NEW_RECORD"
        session.pop('submitted', None)
        session.pop('board', None)
        session.modified = True
        return 'TRY_AGAIN'
    """Board has been cleared from a game completion and 
    server must now generate a new board and validate the result.
    This counts as a try, since the client is still attempting validation"""
    if not session.get('board', False):
        session['board'] = boggle_game.make_board(6)
        session.modified = True
        return jsonify('not-word',
                       status=200,
                       mimetype='application/json')
    if word in session.get('submitted', []):
        """This function uses secondary validation as the game object is 
        stored on the server and does has no ability to check for 
        duplicate words."""
        return 'duplicate'
    session['submitted'] = session.get('submitted', []) + [word]
    return jsonify(boggle_game.check_valid_word(session.get('board', False),
                                                word))
