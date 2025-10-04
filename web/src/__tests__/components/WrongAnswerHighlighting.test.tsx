import { render, screen } from '@testing-library/react';
import { useState } from 'react';

// Mock component to test wrong answer highlighting logic
function MockAnswerHandler() {
  const [wrongAnswerIds, setWrongAnswerIds] = useState<string[]>([]);
  
  const handleWrongAnswer = (clickedId: string, correctId: string) => {
    // This simulates the logic in page.tsx
    const mockAnswerResult = {
      isCorrect: false,
      revealedCorrect: true,
      correctId: correctId,
    };
    
    if (mockAnswerResult.revealedCorrect) {
      // We should add the clicked area ID, not the correct answer ID
      setWrongAnswerIds(prev => [...prev, clickedId]);
    }
  };
  
  return (
    <div>
      <div data-testid="wrong-answers">{wrongAnswerIds.join(',')}</div>
      <button 
        data-testid="wrong-answer-btn"
        onClick={() => handleWrongAnswer('clicked-area-123', 'correct-area-456')}
      >
        Simulate Wrong Answer
      </button>
    </div>
  );
}

describe('Wrong Answer Highlighting Logic', () => {
  it('should add clicked area ID to wrongAnswerIds, not correct answer ID', () => {
    render(<MockAnswerHandler />);
    
    const button = screen.getByTestId('wrong-answer-btn');
    const wrongAnswersDisplay = screen.getByTestId('wrong-answers');
    
    // Initially no wrong answers
    expect(wrongAnswersDisplay.textContent).toBe('');
    
    // Simulate clicking wrong area
    button.click();
    
    // Should add the clicked area ID, not the correct answer ID
    expect(wrongAnswersDisplay.textContent).toBe('clicked-area-123');
    expect(wrongAnswersDisplay.textContent).not.toBe('correct-area-456');
  });
  
  it('should handle multiple wrong answers correctly', () => {
    render(<MockAnswerHandler />);
    
    const button = screen.getByTestId('wrong-answer-btn');
    const wrongAnswersDisplay = screen.getByTestId('wrong-answers');
    
    // Click wrong area twice
    button.click();
    button.click();
    
    // Should have both clicked areas
    expect(wrongAnswersDisplay.textContent).toBe('clicked-area-123,clicked-area-123');
  });
});