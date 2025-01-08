import React from 'react';
import { render, screen, act } from '@testing-library/react';
import AdminAnswerCounts from '../../../components/Session/AnswerCountDisplay'; // Adjust the path as necessary

describe('AdminAnswerCounts Component', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing for "slide" type', () => {
    render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={{ type: 'slide' }}
        socket={mockSocket}
      />
    );

    expect(screen.queryByText(/votes/i)).not.toBeInTheDocument();
  });

  test('renders open-ended vote count', () => {
    render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={{ type: 'open_ended' }}
        socket={mockSocket}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('renders true/false counts correctly', () => {
    const currentItem = {
      type: 'true_false',
      _id: 'q1',
      options: [
        { text: 'True', color: '#4ade80' },
        { text: 'False', color: '#f87171' },
      ],
    };

    render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={currentItem}
        socket={mockSocket}
      />
    );

    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  test('updates open-ended count on socket event', () => {
    const currentItem = { type: 'open_ended', _id: 'q1' };

    render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={currentItem}
        socket={mockSocket}
      />
    );

    const callback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'answer-submitted'
    )[1];

    act(() => {
      callback({ answerDetails: { questionId: 'q1' } });
    });

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('updates true/false counts on socket event', () => {
    const currentItem = {
      type: 'true_false',
      _id: 'q1',
      options: [
        { text: 'True', color: '#4ade80' },
        { text: 'False', color: '#f87171' },
      ],
    };

    render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={currentItem}
        socket={mockSocket}
      />
    );

    const callback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'answer-submitted'
    )[1];

    act(() => {
      callback({ answerDetails: { questionId: 'q1', answer: 'true' } });
    });

    expect(screen.getByText('1')).toBeInTheDocument();

    act(() => {
      callback({ answerDetails: { questionId: 'q1', answer: 'false' } });
    });

    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  test('updates multiple choice counts on socket event', () => {
    const currentItem = {
      type: 'multiple_choice',
      _id: 'q1',
      options: [
        { text: 'Option 1', color: '#4ade80' },
        { text: 'Option 2', color: '#f87171' },
      ],
    };

    render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={currentItem}
        socket={mockSocket}
      />
    );

    const callback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'answer-submitted'
    )[1];

    act(() => {
      callback({ answerDetails: { questionId: 'q1', answer: 'Option 1' } });
    });

    expect(screen.getByText('1')).toBeInTheDocument();

    act(() => {
      callback({ answerDetails: { questionId: 'q1', answer: 'Option 2' } });
    });

    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  test('cleans up socket listener on unmount', () => {
    const { unmount } = render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={{ type: 'poll', _id: 'q1', options: [] }}
        socket={mockSocket}
      />
    );

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith(
      'answer-submitted',
      expect.any(Function)
    );
  });

  test('handles multiple select answers correctly', () => {
    const currentItem = {
      type: 'multiple_select',
      _id: 'q1',
      options: [
        { text: 'Option 1', color: '#4ade80' },
        { text: 'Option 2', color: '#f87171' },
      ],
    };

    render(
      <AdminAnswerCounts
        sessionId="session1"
        currentItem={currentItem}
        socket={mockSocket}
      />
    );

    const callback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'answer-submitted'
    )[1];

    act(() => {
      callback({
        answerDetails: { questionId: 'q1', answer: ['0', '1'] },
      });
    });

    expect(screen.getAllByText('1')).toHaveLength(2);
  });
});
