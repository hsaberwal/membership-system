import { db } from '../database';

export const generateNextMemberNumber = async (membershipTypeId: string): Promise<string> => {
  // Get the id_prefix for this membership type
    console.log('Generating next member number for membership type ID:', membershipTypeId);
    const membershipType = await db('membership_types')
    .where({ id: membershipTypeId })
    .first();

    console.log('Membership Type:', membershipType);

  if (!membershipType) {
    throw new Error('Invalid membership type ID');
  }

//  const { id_prefix } = membershipType;

  // Find the highest member number with this prefix
//  const lastMember = await db('members')
//    .where('member_number', 'like', `${id_prefix}%`)
//    .orderByRaw('CAST(member_number AS BIGINT) DESC')
//    .first();
//  console.log('Prefix:', membershipType.id_prefix);
//  console.log('Last matching member:', lastMember);
//  const nextNumber = lastMember
//    ? (BigInt(lastMember.member_number) + 1n).toString()
//    : id_prefix;
console.log('Membership Type ID:', membershipType.id);
const lastMember = await db('members')
  .where('membership_type_id', membershipType.id)
  .orderByRaw('CAST(member_number AS BIGINT) DESC')
  .first();

//console.log('Generated SQL:', query.toQuery());

let nextNumber = membershipType.id_prefix;
if (lastMember) {
  const lastNum = BigInt(lastMember.member_number);
  nextNumber = (lastNum + 1n).toString();
}

return nextNumber;
};
