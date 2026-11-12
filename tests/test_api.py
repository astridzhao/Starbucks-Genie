import os
from datetime import datetime, timedelta
import sys
import unittest
from unittest.mock import Mock, patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'starbucks_genie/src'))
from starbucks_genie import api
from starbucks_genie.job_manager import JobManager


class DrinkApiTests(unittest.TestCase):
    def setUp(self):
        self.manager = JobManager()
        self.manager_patch = patch.object(api, 'job_manager', self.manager)
        self.manager_patch.start()
        self.addCleanup(self.manager_patch.stop)
        self.key_patch = patch.dict(os.environ, {'OPENAI_API_KEY': 'test-only'})
        self.key_patch.start()
        self.addCleanup(self.key_patch.stop)
        self.client = api.app.test_client()

    def test_invalid_inputs_do_not_create_jobs(self):
        for payload in ([], {'user-input': 'coffee'}, {'user-preference': [None]}, {'user-input': ['a' * 501]}):
            with self.subTest(payload=payload):
                self.assertEqual(self.client.post('/api/drink', json=payload).status_code, 400)
        self.assertEqual(self.client.post('/api/drink', data='bad', content_type='application/json').status_code, 400)
        self.assertFalse(self.manager.jobs)

    def test_missing_key_is_actionable(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            response = self.client.post('/api/drink', json={})
        self.assertEqual(response.status_code, 503)
        self.assertIn('OPENAI_API_KEY', response.json['message'])

    def test_start_preserves_input_fields_and_shares_worker_progress(self):
        recipe = {'name': 'Vanilla Coffee', 'ingredient': ['Coffee', 'Vanilla'], 'recommendation': 'Smooth'}
        crew = Mock()
        def kickoff():
            self.manager.append_event(crew.job_id, 'Developing recipe')
            return Mock(json_dict=recipe)
        crew.kickoff.side_effect = kickoff
        def create(job_id):
            crew.job_id = job_id
            return crew
        def submit(fn, *args): fn(*args)
        with patch.object(api.executor, 'submit', side_effect=submit), patch.object(api, 'create_crew', side_effect=create):
            response = self.client.post('/api/drink', json={'user-input': ['iced'], 'user-preference': ['less sweet']})
        self.assertEqual(response.status_code, 202)
        crew.setup_crew.assert_called_once_with(['less sweet'], ['iced'])
        status = self.client.get('/api/drink/' + response.json['job_id']).json
        self.assertEqual(status['status'], 'SUCCESS')
        self.assertEqual(status['result'], recipe)
        self.assertIn('Developing recipe', [event['data'] for event in status['events']])

    def test_worker_failure_and_invalid_output_are_terminal_errors(self):
        for output in ('kick off crew failed', None, {'name': 'x', 'ingredient': [], 'recommendation': 'x'}):
            self.manager.append_event('test', 'Start')
            crew = Mock()
            crew.kickoff.return_value = output
            with patch.object(api, 'create_crew', return_value=crew):
                api.kickoff_crew('test', [], [])
            status = self.client.get('/api/drink/test').json
            self.assertEqual(status['status'], 'ERROR')
            self.assertIsNone(status['result'])
        crew.setup_crew.side_effect = RuntimeError('secret internal detail')
        with patch.object(api, 'create_crew', return_value=crew):
            api.kickoff_crew('test', [], [])
        self.assertNotIn('secret internal detail', str(self.client.get('/api/drink/test').json))

    def test_missing_job_does_not_expose_other_jobs(self):
        self.manager.append_event('private-job', 'Start')
        response = self.client.get('/api/drink/missing')
        self.assertEqual(response.status_code, 404)
        self.assertNotIn('private-job', str(response.json))

    def test_preflight_and_health_work_without_ai_initialization(self):
        response = self.client.options('/api/drink', headers={
            'Origin': 'http://localhost:3000', 'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'})
        self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'http://localhost:3000')
        self.assertEqual(self.client.get('/api/health').json['status'], 'ok')

    def test_cleanup_removes_old_terminal_jobs_and_preserves_running_jobs(self):
        for job_id in ('old', 'running', 'new'):
            self.manager.append_event(job_id, 'start')
        self.manager.jobs['old'].status = 'SUCCESS'
        self.manager.jobs['old'].created_at = datetime.now() - timedelta(hours=2)
        self.manager.jobs['running'].created_at = datetime.now() - timedelta(hours=2)
        self.manager.jobs['new'].status = 'ERROR'
        self.manager.cleanup_old_jobs()
        self.assertEqual(set(self.manager.jobs), {'running', 'new'})
