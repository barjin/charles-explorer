-- CreateTable
CREATE TABLE "Text" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "lang" TEXT NOT NULL,

    CONSTRAINT "Text_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "private_id" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "authors" TEXT NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "form" TEXT NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClassNames" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassSyllabus" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassAnnotation" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassToDepartment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassToFaculty" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassToProgramme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DepartmentNames" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_DepartmentAbbreviations" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_DepartmentToFaculty" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DepartmentToProgramme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DepartmentToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DepartmentToPublication" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FacultyNames" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_FacultyAbbreviations" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_FacultyToProgramme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FacultyToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FacultyToPublication" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PersonNames" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PersonToPublication" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PersonToProgramme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PublicationNames" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PublicationAbstract" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PublicationKeywords" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ProgrammeNames" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_RelatedProgrammes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProgrammeProfiles" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_private_id_key" ON "Person"("private_id");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassNames_AB_unique" ON "_ClassNames"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassNames_B_index" ON "_ClassNames"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassSyllabus_AB_unique" ON "_ClassSyllabus"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassSyllabus_B_index" ON "_ClassSyllabus"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassAnnotation_AB_unique" ON "_ClassAnnotation"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassAnnotation_B_index" ON "_ClassAnnotation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassToDepartment_AB_unique" ON "_ClassToDepartment"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassToDepartment_B_index" ON "_ClassToDepartment"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassToFaculty_AB_unique" ON "_ClassToFaculty"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassToFaculty_B_index" ON "_ClassToFaculty"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassToPerson_AB_unique" ON "_ClassToPerson"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassToPerson_B_index" ON "_ClassToPerson"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassToProgramme_AB_unique" ON "_ClassToProgramme"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassToProgramme_B_index" ON "_ClassToProgramme"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentNames_AB_unique" ON "_DepartmentNames"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentNames_B_index" ON "_DepartmentNames"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentAbbreviations_AB_unique" ON "_DepartmentAbbreviations"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentAbbreviations_B_index" ON "_DepartmentAbbreviations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentToFaculty_AB_unique" ON "_DepartmentToFaculty"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentToFaculty_B_index" ON "_DepartmentToFaculty"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentToProgramme_AB_unique" ON "_DepartmentToProgramme"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentToProgramme_B_index" ON "_DepartmentToProgramme"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentToPerson_AB_unique" ON "_DepartmentToPerson"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentToPerson_B_index" ON "_DepartmentToPerson"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentToPublication_AB_unique" ON "_DepartmentToPublication"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentToPublication_B_index" ON "_DepartmentToPublication"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FacultyNames_AB_unique" ON "_FacultyNames"("A", "B");

-- CreateIndex
CREATE INDEX "_FacultyNames_B_index" ON "_FacultyNames"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FacultyAbbreviations_AB_unique" ON "_FacultyAbbreviations"("A", "B");

-- CreateIndex
CREATE INDEX "_FacultyAbbreviations_B_index" ON "_FacultyAbbreviations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FacultyToProgramme_AB_unique" ON "_FacultyToProgramme"("A", "B");

-- CreateIndex
CREATE INDEX "_FacultyToProgramme_B_index" ON "_FacultyToProgramme"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FacultyToPerson_AB_unique" ON "_FacultyToPerson"("A", "B");

-- CreateIndex
CREATE INDEX "_FacultyToPerson_B_index" ON "_FacultyToPerson"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FacultyToPublication_AB_unique" ON "_FacultyToPublication"("A", "B");

-- CreateIndex
CREATE INDEX "_FacultyToPublication_B_index" ON "_FacultyToPublication"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PersonNames_AB_unique" ON "_PersonNames"("A", "B");

-- CreateIndex
CREATE INDEX "_PersonNames_B_index" ON "_PersonNames"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PersonToPublication_AB_unique" ON "_PersonToPublication"("A", "B");

-- CreateIndex
CREATE INDEX "_PersonToPublication_B_index" ON "_PersonToPublication"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PersonToProgramme_AB_unique" ON "_PersonToProgramme"("A", "B");

-- CreateIndex
CREATE INDEX "_PersonToProgramme_B_index" ON "_PersonToProgramme"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PublicationNames_AB_unique" ON "_PublicationNames"("A", "B");

-- CreateIndex
CREATE INDEX "_PublicationNames_B_index" ON "_PublicationNames"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PublicationAbstract_AB_unique" ON "_PublicationAbstract"("A", "B");

-- CreateIndex
CREATE INDEX "_PublicationAbstract_B_index" ON "_PublicationAbstract"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PublicationKeywords_AB_unique" ON "_PublicationKeywords"("A", "B");

-- CreateIndex
CREATE INDEX "_PublicationKeywords_B_index" ON "_PublicationKeywords"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgrammeNames_AB_unique" ON "_ProgrammeNames"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgrammeNames_B_index" ON "_ProgrammeNames"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RelatedProgrammes_AB_unique" ON "_RelatedProgrammes"("A", "B");

-- CreateIndex
CREATE INDEX "_RelatedProgrammes_B_index" ON "_RelatedProgrammes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgrammeProfiles_AB_unique" ON "_ProgrammeProfiles"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgrammeProfiles_B_index" ON "_ProgrammeProfiles"("B");

-- AddForeignKey
ALTER TABLE "_ClassNames" ADD CONSTRAINT "_ClassNames_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassNames" ADD CONSTRAINT "_ClassNames_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassSyllabus" ADD CONSTRAINT "_ClassSyllabus_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassSyllabus" ADD CONSTRAINT "_ClassSyllabus_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassAnnotation" ADD CONSTRAINT "_ClassAnnotation_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassAnnotation" ADD CONSTRAINT "_ClassAnnotation_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToDepartment" ADD CONSTRAINT "_ClassToDepartment_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToDepartment" ADD CONSTRAINT "_ClassToDepartment_B_fkey" FOREIGN KEY ("B") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToFaculty" ADD CONSTRAINT "_ClassToFaculty_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToFaculty" ADD CONSTRAINT "_ClassToFaculty_B_fkey" FOREIGN KEY ("B") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToPerson" ADD CONSTRAINT "_ClassToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToPerson" ADD CONSTRAINT "_ClassToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToProgramme" ADD CONSTRAINT "_ClassToProgramme_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToProgramme" ADD CONSTRAINT "_ClassToProgramme_B_fkey" FOREIGN KEY ("B") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentNames" ADD CONSTRAINT "_DepartmentNames_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentNames" ADD CONSTRAINT "_DepartmentNames_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentAbbreviations" ADD CONSTRAINT "_DepartmentAbbreviations_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentAbbreviations" ADD CONSTRAINT "_DepartmentAbbreviations_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToFaculty" ADD CONSTRAINT "_DepartmentToFaculty_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToFaculty" ADD CONSTRAINT "_DepartmentToFaculty_B_fkey" FOREIGN KEY ("B") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToProgramme" ADD CONSTRAINT "_DepartmentToProgramme_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToProgramme" ADD CONSTRAINT "_DepartmentToProgramme_B_fkey" FOREIGN KEY ("B") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToPerson" ADD CONSTRAINT "_DepartmentToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToPerson" ADD CONSTRAINT "_DepartmentToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToPublication" ADD CONSTRAINT "_DepartmentToPublication_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToPublication" ADD CONSTRAINT "_DepartmentToPublication_B_fkey" FOREIGN KEY ("B") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyNames" ADD CONSTRAINT "_FacultyNames_A_fkey" FOREIGN KEY ("A") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyNames" ADD CONSTRAINT "_FacultyNames_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyAbbreviations" ADD CONSTRAINT "_FacultyAbbreviations_A_fkey" FOREIGN KEY ("A") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyAbbreviations" ADD CONSTRAINT "_FacultyAbbreviations_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyToProgramme" ADD CONSTRAINT "_FacultyToProgramme_A_fkey" FOREIGN KEY ("A") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyToProgramme" ADD CONSTRAINT "_FacultyToProgramme_B_fkey" FOREIGN KEY ("B") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyToPerson" ADD CONSTRAINT "_FacultyToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyToPerson" ADD CONSTRAINT "_FacultyToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyToPublication" ADD CONSTRAINT "_FacultyToPublication_A_fkey" FOREIGN KEY ("A") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyToPublication" ADD CONSTRAINT "_FacultyToPublication_B_fkey" FOREIGN KEY ("B") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonNames" ADD CONSTRAINT "_PersonNames_A_fkey" FOREIGN KEY ("A") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonNames" ADD CONSTRAINT "_PersonNames_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToPublication" ADD CONSTRAINT "_PersonToPublication_A_fkey" FOREIGN KEY ("A") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToPublication" ADD CONSTRAINT "_PersonToPublication_B_fkey" FOREIGN KEY ("B") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToProgramme" ADD CONSTRAINT "_PersonToProgramme_A_fkey" FOREIGN KEY ("A") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToProgramme" ADD CONSTRAINT "_PersonToProgramme_B_fkey" FOREIGN KEY ("B") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PublicationNames" ADD CONSTRAINT "_PublicationNames_A_fkey" FOREIGN KEY ("A") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PublicationNames" ADD CONSTRAINT "_PublicationNames_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PublicationAbstract" ADD CONSTRAINT "_PublicationAbstract_A_fkey" FOREIGN KEY ("A") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PublicationAbstract" ADD CONSTRAINT "_PublicationAbstract_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PublicationKeywords" ADD CONSTRAINT "_PublicationKeywords_A_fkey" FOREIGN KEY ("A") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PublicationKeywords" ADD CONSTRAINT "_PublicationKeywords_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgrammeNames" ADD CONSTRAINT "_ProgrammeNames_A_fkey" FOREIGN KEY ("A") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgrammeNames" ADD CONSTRAINT "_ProgrammeNames_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedProgrammes" ADD CONSTRAINT "_RelatedProgrammes_A_fkey" FOREIGN KEY ("A") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedProgrammes" ADD CONSTRAINT "_RelatedProgrammes_B_fkey" FOREIGN KEY ("B") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgrammeProfiles" ADD CONSTRAINT "_ProgrammeProfiles_A_fkey" FOREIGN KEY ("A") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgrammeProfiles" ADD CONSTRAINT "_ProgrammeProfiles_B_fkey" FOREIGN KEY ("B") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;
