import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, status: true, passwordHash: true } });
  console.log("USERS IN DB:");
  for (const u of users) {
    console.log(`  ${u.email} | role=${u.role} | status=${u.status} | hash=${u.passwordHash}`);
  }
  // Test lookup
  const found = await prisma.user.findUnique({ where: { email: "r.kumar@cabsec.gov.in" } });
  console.log("\nLOOKUP r.kumar@cabsec.gov.in:", found ? "FOUND" : "NOT FOUND");
  if (found) {
    console.log(`  stored hash: "${found.passwordHash}"`);
    console.log(`  match demo123: ${found.passwordHash === "demo123"}`);
    console.log(`  status: ${found.status}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
