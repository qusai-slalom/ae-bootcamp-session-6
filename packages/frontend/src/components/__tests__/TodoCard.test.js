import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoCard from '../TodoCard';

describe('TodoCard Component', () => {
  const mockTodo = {
    id: 1,
    title: 'Test Todo',
    dueDate: '2025-12-25',
    completed: 0,
    createdAt: '2025-11-01T00:00:00Z'
  };

  const mockHandlers = {
    onToggle: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render todo title and due date', () => {
    render(<TodoCard todo={mockTodo} {...mockHandlers} isLoading={false} />);
    
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
    expect(screen.getByText(/December 25, 2025/)).toBeInTheDocument();
  });

  it('should render unchecked checkbox when todo is incomplete', () => {
    render(<TodoCard todo={mockTodo} {...mockHandlers} isLoading={false} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked checkbox when todo is complete', () => {
    const completedTodo = { ...mockTodo, completed: 1 };
    render(<TodoCard todo={completedTodo} {...mockHandlers} isLoading={false} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onToggle when checkbox is clicked', () => {
    render(<TodoCard todo={mockTodo} {...mockHandlers} isLoading={false} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockHandlers.onToggle).toHaveBeenCalledWith(mockTodo.id);
  });

  it('should show edit button', () => {
    render(<TodoCard todo={mockTodo} {...mockHandlers} isLoading={false} />);
    
    const editButton = screen.getByLabelText(/Edit/);
    expect(editButton).toBeInTheDocument();
  });

  it('should show delete button', () => {
    render(<TodoCard todo={mockTodo} {...mockHandlers} isLoading={false} />);
    
    const deleteButton = screen.getByLabelText(/Delete/);
    expect(deleteButton).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked and confirmed', () => {
    window.confirm = jest.fn(() => true);
    render(<TodoCard todo={mockTodo} {...mockHandlers} isLoading={false} />);
    
    const deleteButton = screen.getByLabelText(/Delete/);
    fireEvent.click(deleteButton);
    
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockTodo.id);
  });

  it('should enter edit mode when edit button is clicked', () => {
    render(<TodoCard todo={mockTodo} {...mockHandlers} isLoading={false} />);
    
    const editButton = screen.getByLabelText(/Edit/);
    fireEvent.click(editButton);
    
    expect(screen.getByDisplayValue('Test Todo')).toBeInTheDocument();
  });

  it('should apply completed class when todo is completed', () => {
    const completedTodo = { ...mockTodo, completed: 1 };
    const { container } = render(<TodoCard todo={completedTodo} {...mockHandlers} isLoading={false} />);
    
    const card = container.querySelector('.todo-card');
    expect(card).toHaveClass('completed');
  });

  it('should not render due date when dueDate is null', () => {
    const todoNoDate = { ...mockTodo, dueDate: null };
    render(<TodoCard todo={todoNoDate} {...mockHandlers} isLoading={false} />);
    
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  describe('overdue indicator', () => {
    const renderCard = (overrides) => render(
      <TodoCard todo={{ ...mockTodo, ...overrides }} {...mockHandlers} isLoading={false} />
    );

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 9, 16));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should mark an incomplete todo due before today as overdue', () => {
      renderCard({ dueDate: '2026-10-15', completed: 0 });

      const dueDate = screen.getByText(/Due:/);
      const badge = screen.getByText(/Overdue by/);
      expect(screen.getByTestId('todo-card')).toHaveClass('overdue');
      expect(dueDate).toHaveClass('overdue');
      expect(badge).toHaveClass('overdue-badge');
      expect(dueDate).toContainElement(badge);
    });

    it.each([
      ['due today', { dueDate: '2026-10-16', completed: 0 }],
      ['due in the future', { dueDate: '2026-10-20', completed: 0 }],
      ['completed with a past due date', { dueDate: '2026-10-01', completed: 1 }],
    ])('should not mark a todo %s as overdue', (_, overrides) => {
      renderCard(overrides);

      expect(screen.getByTestId('todo-card')).not.toHaveClass('overdue');
      expect(screen.getByText(/Due:/)).not.toHaveClass('overdue');
      expect(screen.queryByText(/Overdue by/)).not.toBeInTheDocument();
    });

    it('should not mark a todo without a due date as overdue', () => {
      renderCard({ dueDate: null, completed: 0 });

      expect(screen.getByTestId('todo-card')).not.toHaveClass('overdue');
      expect(screen.queryByText(/Overdue by/)).not.toBeInTheDocument();
    });

    it('should not show the overdue badge in edit mode', () => {
      renderCard({ dueDate: '2026-10-15', completed: 0 });

      fireEvent.click(screen.getByLabelText(/Edit/));

      expect(screen.queryByText(/Overdue by/)).not.toBeInTheDocument();
    });

    it('should render a todo with an invalid due date without an overdue badge', () => {
      renderCard({ dueDate: 'garbage', completed: 0 });

      expect(screen.getByText('Test Todo')).toBeInTheDocument();
      expect(screen.queryByText(/Overdue by/)).not.toBeInTheDocument();
    });

    it.each([
      ['2026-10-15', 'Overdue by 1 day'],
      ['2026-10-11', 'Overdue by 5 days'],
    ])('should show how many days a todo due %s is overdue', (dueDate, expectedLabel) => {
      renderCard({ dueDate, completed: 0 });

      expect(screen.getByText(expectedLabel)).toHaveClass('overdue-badge');
    });

    describe('when the todo changes', () => {
      const rerenderCard = (rerender, overrides) => rerender(
        <TodoCard todo={{ ...mockTodo, ...overrides }} {...mockHandlers} isLoading={false} />
      );

      it.each([
        ['marked complete', { dueDate: '2026-10-15', completed: 0 }, { dueDate: '2026-10-15', completed: 1 }, false],
        ['marked incomplete', { dueDate: '2026-10-15', completed: 1 }, { dueDate: '2026-10-15', completed: 0 }, true],
        ['rescheduled to the future', { dueDate: '2026-10-15', completed: 0 }, { dueDate: '2026-10-20', completed: 0 }, false],
        ['rescheduled to today', { dueDate: '2026-10-15', completed: 0 }, { dueDate: '2026-10-16', completed: 0 }, false],
        ['due date removed', { dueDate: '2026-10-15', completed: 0 }, { dueDate: null, completed: 0 }, false],
        ['rescheduled to the past', { dueDate: '2026-10-20', completed: 0 }, { dueDate: '2026-10-10', completed: 0 }, true],
      ])('should update the indicator when %s', (_, before, after, expectedOverdue) => {
        const { rerender } = renderCard(before);

        rerenderCard(rerender, after);

        expect(screen.getByTestId('todo-card').classList.contains('overdue')).toBe(expectedOverdue);
        expect(screen.queryAllByText(/Overdue by/)).toHaveLength(expectedOverdue ? 1 : 0);
      });
    });
  });
});
