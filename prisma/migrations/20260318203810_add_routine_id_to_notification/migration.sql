-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "routineId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
