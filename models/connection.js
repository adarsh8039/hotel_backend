// use `prisma` in your application to read and write data in your DB
var {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {prisma};
