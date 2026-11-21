const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ take: 15, select: { email: true, role: true, name: true } })
  .then(users => {
    users.forEach(u => console.log(u.role, u.email));
    p.$disconnect();
  })
  .catch(e => { console.error(e.message); p.$disconnect(); });
