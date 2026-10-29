import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Premier login screen', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
});
