-- DropForeignKey
ALTER TABLE "public"."Log" DROP CONSTRAINT "Log_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskResult" DROP CONSTRAINT "TaskResult_taskId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskResult" ADD CONSTRAINT "TaskResult_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
