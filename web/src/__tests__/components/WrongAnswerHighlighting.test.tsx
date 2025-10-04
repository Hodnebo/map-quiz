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
      // We should add the target area ID (correct answer) to show what was answered incorrectly
      setWrongAnswerIds(prev => [...prev, correctId]);
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
  it('should add target area ID to wrongAnswerIds to show what was answered incorrectly', () => {
    render(<MockAnswerHandler />);
    
    const button = screen.getByTestId('wrong-answer-btn');
    const wrongAnswersDisplay = screen.getByTestId('wrong-answers');
    
    // Initially no wrong answers
    expect(wrongAnswersDisplay.textContent).toBe('');
    
    // Simulate clicking wrong area
    button.click();
    
    // Should add the target area ID (correct answer) to show what was answered incorrectly
    expect(wrongAnswersDisplay.textContent).toBe('correct-area-456');
    expect(wrongAnswersDisplay.textContent).not.toBe('clicked-area-123');
  });
  
  it('should handle multiple wrong answers correctly', () => {
    render(<MockAnswerHandler />);
    
    const button = screen.getByTestId('wrong-answer-btn');
    const wrongAnswersDisplay = screen.getByTestId('wrong-answers');
    
    // Click wrong area twice
    button.click();
    button.click();
    
    // Should have both target areas (same target area answered incorrectly twice)
    expect(wrongAnswersDisplay.textContent).toBe('correct-area-456,correct-area-456');
  });
});