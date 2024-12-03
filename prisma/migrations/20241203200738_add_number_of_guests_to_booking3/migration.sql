/*
  Warnings:

  - You are about to drop the column `bathroomCount` on the `Property` table. All the data in the column will be lost.
  - Added the required column `bathRoomCount` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "bathroomCount",
ADD COLUMN     "bathRoomCount" INTEGER NOT NULL;
