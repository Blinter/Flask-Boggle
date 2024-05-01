from unittest import TestCase
from app import app
from flask import session


class FlaskTests(TestCase):
    def setUp(self):
        """Sets app CONFIG to testing and initializes a Flask Test Client"""
        self.client = app.test_client()
        app.config['TESTING'] = True

    def test_homepage(self):
        """Make sure information is in the session and HTML is displayed"""
        with self.client:
            response = self.client.get('/')
            self.assertIn('board', session)
            self.assertIsNone(session.get('highs_core'))
            self.assertIsNone(session.get('games_played'))
            self.assertIn(b'<span id="highScore">', response.data)
            self.assertIn(b'<span id="score">', response.data)
            self.assertIn(b'<span id="time">', response.data)

    def test_valid_word(self):
        """Test if word is valid by modifying the board in the session"""
        with self.client as client:
            with client.session_transaction() as sess:
                sess['board'] = [["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"]]
        response = self.client.post('/validate', data=dict(word='fat'))
        self.assertIn(b'ok', response.data)

    def test_duplicate_word(self):
        """Test if word is valid by modifying the board in the session"""
        with self.client as client:
            with client.session_transaction() as sess:
                sess['board'] = [["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"],
                                 ["F", "A", "T", "T", "T"]]
        response = self.client.post('/validate', data=dict(word='fat'))
        self.assertIn(b'ok', response.data)
        response = self.client.post('/validate', data=dict(word='fat'))
        self.assertIn(b'duplicate', response.data)

    def test_invalid_word(self):
        """Test if word is in the dictionary"""
        self.client.get('/')
        response = self.client.post('/validate', data=dict(word='impossible'))
        self.assertIn(b'not-on-board', response.data)

    def non_english_word(self):
        """Test if word is on the board"""
        self.client.get('/')
        response = self.client.get(
            '/validate', data=dict(word='fsjdakfkldsfjdslkfjdlksf'))
        self.assertIn(b'not-word', response.data)
