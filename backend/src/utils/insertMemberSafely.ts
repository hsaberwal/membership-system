import { db } from '../database';

export async function generateNextMemberNumber(membershipTypeId: string): Promise<string> {
  const membershipType = await db('membership_types')
    .where({ id: membershipTypeId })
    .first();

  if (!membershipType) {
    throw new Error('Invalid membership type');
  }

  const prefix = membershipType.id_prefix;

  const lastMember = await db('members')
    .where('member_number', 'like', `${prefix}%`)
    .orderByRaw('CAST(member_number AS BIGINT) DESC')
    .first();

  let nextNumber: string;
  if (lastMember) {
    nextNumber = (BigInt(lastMember.member_number) + 1n).toString();
  } else {
    nextNumber = prefix;
  }

  return nextNumber;
}

