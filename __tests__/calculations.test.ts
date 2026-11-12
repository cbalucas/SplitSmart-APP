import { CalculationService, Balance } from '../src/services/calculations';

const p = (id: string, name = id) => ({ id, name } as any);
const exp = (id: string, payerId: string, amount: number) => ({ id, payerId, amount } as any);
const split = (participantId: string, amount: number) => ({ participantId, amount } as any);

describe('CalculationService.calculateBalances', () => {
  it('calcula pagado, debido y balance neto', () => {
    const balances = CalculationService.calculateBalances(
      [p('a'), p('b'), p('c')],
      [exp('e1', 'a', 90)],
      [split('a', 30), split('b', 30), split('c', 30)]
    );
    const byId = Object.fromEntries(balances.map(b => [b.participantId, b]));
    expect(byId.a.balance).toBe(-60); // le deben 60
    expect(byId.b.balance).toBe(30);
    expect(byId.c.balance).toBe(30);
  });

  it('la suma de los balances es 0', () => {
    const balances = CalculationService.calculateBalances(
      [p('a'), p('b'), p('c')],
      [exp('e1', 'a', 100), exp('e2', 'b', 50)],
      [split('a', 50), split('b', 50), split('c', 50)]
    );
    const total = balances.reduce((acc, b) => acc + b.balance, 0);
    expect(Math.abs(total)).toBeLessThan(0.001);
  });

  it('respeta pagos múltiples (payers) en un gasto', () => {
    const e = { id: 'e1', payerId: 'a', amount: 100, payers: [{ participantId: 'a', amount: 60 }, { participantId: 'b', amount: 40 }] } as any;
    const balances = CalculationService.calculateBalances([p('a'), p('b')], [e], [split('a', 50), split('b', 50)]);
    expect(balances.find(b => b.participantId === 'a')!.balance).toBe(-10);
    expect(balances.find(b => b.participantId === 'b')!.balance).toBe(10);
  });

  it('descuenta las liquidaciones ya pagadas', () => {
    const balances = CalculationService.calculateBalancesWithSettlements(
      [p('a'), p('b')],
      [exp('e1', 'a', 100)],
      [split('a', 50), split('b', 50)],
      [{ fromParticipantId: 'b', toParticipantId: 'a', amount: 50 }]
    );
    expect(balances.every(b => Math.abs(b.balance) < 0.001)).toBe(true);
  });
});

describe('CalculationService.calculateOptimalSettlements', () => {
  const mk = (id: string, balance: number): Balance => ({ participantId: id, participantName: id, totalPaid: 0, totalOwed: 0, balance });

  it('liquida con pocas transferencias y deja todo en cero', () => {
    const balances = [mk('a', -60), mk('b', 30), mk('c', 30)];
    const settlements = CalculationService.calculateOptimalSettlements(balances);
    expect(settlements).toHaveLength(2);
    expect(settlements.every(s => s.toParticipantId === 'a')).toBe(true);
    expect(settlements.reduce((acc, s) => acc + s.amount, 0)).toBeCloseTo(60, 2);
  });

  it('no devuelve liquidaciones si todos están saldados', () => {
    expect(CalculationService.calculateOptimalSettlements([mk('a', 0), mk('b', 0.005)])).toEqual([]);
  });

  it('no modifica los balances recibidos', () => {
    const balances = [mk('a', -60), mk('b', 60)];
    CalculationService.calculateOptimalSettlements(balances);
    expect(balances.map(b => b.balance)).toEqual([-60, 60]);
  });
});

describe('CalculationService.calculateEqualSplit', () => {
  it('divide en partes iguales', () => {
    const result = CalculationService.calculateEqualSplit(90, [p('a'), p('b'), p('c')]);
    expect(result.map(r => r.amount)).toEqual([30, 30, 30]);
  });

  it('reparte los centavos sin perder ni crear dinero', () => {
    const result = CalculationService.calculateEqualSplit(100, [p('a'), p('b'), p('c')]);
    expect(result.map(r => r.amount)).toEqual([33.34, 33.33, 33.33]);
    expect(Math.round(result.reduce((acc, r) => acc + r.amount, 0) * 100)).toBe(10000);
  });

  it('sin participantes devuelve lista vacía', () => {
    expect(CalculationService.calculateEqualSplit(100, [])).toEqual([]);
  });
});
