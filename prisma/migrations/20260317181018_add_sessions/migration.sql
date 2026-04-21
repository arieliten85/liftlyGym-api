/*
  Warnings:

  - Added the required column `updatedAt` to the `Routine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "wasAbandoned" BOOLEAN NOT NULL DEFAULT false,
    "intensity" INTEGER,
    "energy" INTEGER,
    "painLevel" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SessionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetLog" (
    "id" TEXT NOT NULL,
    "sessionExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "repsCompleted" INTEGER,
    "weight" DOUBLE PRECISION,
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SetLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
