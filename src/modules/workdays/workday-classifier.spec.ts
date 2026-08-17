import { TaskEntryResponse } from '../entries/entries.types';
import { classifyWorkdays } from './workday-classifier';

function entry(date: string, minutes: number): TaskEntryResponse {
  return {
    id: 'x',
    date,
    task_code: 'DEV',
    description: 'desc',
    time_spent_minutes: minutes,
    hourly_rate: 0,
    total_amount: 0,
    status: 'done',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function byDate(
  entries: TaskEntryResponse[],
): Map<string, TaskEntryResponse[]> {
  const map = new Map<string, TaskEntryResponse[]>();
  for (const e of entries) {
    const list = map.get(e.date);
    if (list) list.push(e);
    else map.set(e.date, [e]);
  }
  return map;
}

describe('classifyWorkdays', () => {
  // 2024-01-15 é segunda, 2024-01-20 é sábado, 2024-01-21 é domingo.
  it('marca dias úteis sem apontamento como not_worked', () => {
    const result = classifyWorkdays(
      '2024-01-15',
      '2024-01-16',
      new Map(),
      new Set(),
    );
    expect(result).toHaveLength(2);
    expect(
      result.every((d) => d.status === 'not_worked' && d.total_minutes === 0),
    ).toBe(true);
  });

  it('omite fins de semana sem apontamento', () => {
    const result = classifyWorkdays(
      '2024-01-19',
      '2024-01-21',
      new Map(),
      new Set(),
    );
    // só sexta (19) deveria aparecer; sábado/domingo sem entries são pulados
    expect(result.map((d) => d.date)).toEqual(['2024-01-19']);
  });

  it('inclui fim de semana quando há apontamento (retroativo)', () => {
    const entries = byDate([entry('2024-01-20', 120)]);
    const result = classifyWorkdays(
      '2024-01-20',
      '2024-01-20',
      entries,
      new Set(),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: '2024-01-20',
      status: 'worked',
      worked_hours: '02:00',
      total_minutes: 120,
    });
  });

  it('soma múltiplos lançamentos do mesmo dia', () => {
    const entries = byDate([entry('2024-01-15', 90), entry('2024-01-15', 45)]);
    const result = classifyWorkdays(
      '2024-01-15',
      '2024-01-15',
      entries,
      new Set(),
    );
    expect(result[0]).toMatchObject({
      status: 'worked',
      worked_hours: '02:15',
      total_minutes: 135,
    });
  });

  it('omite feriados mesmo quando há apontamento', () => {
    const entries = byDate([entry('2024-01-15', 60)]);
    const result = classifyWorkdays(
      '2024-01-15',
      '2024-01-15',
      entries,
      new Set(['2024-01-15']),
    );
    expect(result).toHaveLength(0);
  });

  it('itera do fim para o início (ordem decrescente)', () => {
    const result = classifyWorkdays(
      '2024-01-15',
      '2024-01-17',
      new Map(),
      new Set(),
    );
    expect(result.map((d) => d.date)).toEqual([
      '2024-01-17',
      '2024-01-16',
      '2024-01-15',
    ]);
  });

  it('lança erro para data inválida', () => {
    expect(() =>
      classifyWorkdays('not-a-date', '2024-01-15', new Map(), new Set()),
    ).toThrow();
  });
});
