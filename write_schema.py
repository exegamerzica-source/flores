import os

schema_code = """generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Settings {
  id           String @id @default("global")
  whatsapp     String @default("5554981311242")
  contactEmail String @default("contato@pracadasflowers.shop")
  storeName    String @default("Praça das Flowers")
}

model Category {
  id       String    @id @default(uuid())
  name     String
  slug     String    @unique
  products Product[]
}

model Product {
  id          Int      @id @default(autoincrement())
  title       String
  price       String
  image       String
  raw_image   String
  description String?
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
}
"""

with open(r'C:\Users\Soubw\Documents\flores\next-app\prisma\schema.prisma', 'w', encoding='utf-8') as f:
    f.write(schema_code)
print("Schema written!")
