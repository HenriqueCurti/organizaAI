export function calculateFamilyQuotas({
  families,
  totalCosts,
  minPayingAge,
  estimatedPayingAttendees,
  isClosed
}: {
  families: { id: string; members: { age: number }[]; [key: string]: any }[];
  totalCosts: number;
  minPayingAge: number;
  estimatedPayingAttendees?: number | null;
  isClosed?: boolean;
}) {
  const sortedFamilies = [...families].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.id.localeCompare(b.id);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (a.createdAt && b.createdAt) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });

  let actualPayingParticipants = 0;
  let actualExemptParticipants = 0;
  
  sortedFamilies.forEach(f => {
    f.members.forEach(m => {
      if (m.age >= minPayingAge) {
        actualPayingParticipants++;
      } else {
        actualExemptParticipants++;
      }
    });
  });

  const effectiveDivisor = isClosed
    ? (actualPayingParticipants > 0 ? actualPayingParticipants : (estimatedPayingAttendees || 1))
    : Math.max(actualPayingParticipants, estimatedPayingAttendees || 1);

  let remainingCosts = totalCosts;
  let remainingPayingParticipants = effectiveDivisor;

  const familyQuotas = new Map<string, number>();

  for (const family of sortedFamilies) {
    const payingCount = family.members.filter(m => m.age >= minPayingAge).length;
    let familyCost = 0;
    
    if (payingCount > 0 && remainingPayingParticipants > 0) {
      familyCost = Number((remainingCosts * (payingCount / remainingPayingParticipants)).toFixed(2));
      remainingCosts = Number((remainingCosts - familyCost).toFixed(2));
      remainingPayingParticipants -= payingCount;
    }
    
    familyQuotas.set(family.id, familyCost);
  }

  return {
    familyQuotas,
    actualPayingParticipants,
    actualExemptParticipants,
    effectiveDivisor,
    costPerQuota: effectiveDivisor > 0 ? totalCosts / effectiveDivisor : 0
  };
}
