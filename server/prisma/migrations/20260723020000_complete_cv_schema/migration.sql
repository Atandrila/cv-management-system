-- Complete the CV management schema after the initial authentication migration.
CREATE TYPE "AttributeCategory" AS ENUM ('CERTIFICATION', 'DOMAIN_KNOWLEDGE', 'PERSONAL_INFORMATION', 'SOFT_SKILLS', 'EDUCATION', 'EXPERIENCE', 'OTHER');
CREATE TYPE "AttributeType" AS ENUM ('STRING', 'TEXT', 'IMAGE', 'NUMERIC', 'DATE', 'PERIOD', 'BOOLEAN', 'SELECT');
CREATE TYPE "PositionLevel" AS ENUM ('JUNIOR', 'MIDDLE', 'SENIOR', 'C_LEVEL');
CREATE TYPE "AccessOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'CONTAINS', 'IS_TRUE', 'IS_FALSE');
CREATE TYPE "CvStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "AttributeDefinition" (
    "id" TEXT NOT NULL,
    "category" "AttributeCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "AttributeType" NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttributeOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "attributeId" TEXT NOT NULL,
    CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfileAttributeValue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfileAttributeValue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TechnologyTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "TechnologyTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectTag" (
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("projectId","tagId")
);

CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "level" "PositionLevel",
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "maxProjects" INTEGER NOT NULL DEFAULT 3,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PositionAttribute" (
    "positionId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PositionAttribute_pkey" PRIMARY KEY ("positionId","attributeId")
);

CREATE TABLE "AccessRule" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "operator" "AccessOperator" NOT NULL,
    "expected" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "AccessRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PositionTag" (
    "positionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "PositionTag_pkey" PRIMARY KEY ("positionId","tagId")
);

CREATE TABLE "Cv" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "status" "CvStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "Cv_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CvProject" (
    "cvId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CvProject_pkey" PRIMARY KEY ("cvId","projectId")
);

CREATE TABLE "DiscussionPost" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CvLike" (
    "cvId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CvLike_pkey" PRIMARY KEY ("cvId","userId")
);

CREATE UNIQUE INDEX "AttributeDefinition_name_key" ON "AttributeDefinition"("name");
CREATE INDEX "AttributeDefinition_category_name_idx" ON "AttributeDefinition"("category", "name");
CREATE INDEX "AttributeDefinition_updatedAt_idx" ON "AttributeDefinition"("updatedAt");
CREATE INDEX "AttributeOption_attributeId_sortOrder_idx" ON "AttributeOption"("attributeId", "sortOrder");
CREATE UNIQUE INDEX "AttributeOption_attributeId_label_key" ON "AttributeOption"("attributeId", "label");
CREATE INDEX "ProfileAttributeValue_attributeId_idx" ON "ProfileAttributeValue"("attributeId");
CREATE UNIQUE INDEX "ProfileAttributeValue_userId_attributeId_key" ON "ProfileAttributeValue"("userId", "attributeId");
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt");
CREATE UNIQUE INDEX "TechnologyTag_name_key" ON "TechnologyTag"("name");
CREATE INDEX "TechnologyTag_name_idx" ON "TechnologyTag"("name");
CREATE INDEX "ProjectTag_tagId_idx" ON "ProjectTag"("tagId");
CREATE INDEX "Position_updatedAt_idx" ON "Position"("updatedAt");
CREATE INDEX "Position_title_idx" ON "Position"("title");
CREATE INDEX "Position_company_level_idx" ON "Position"("company", "level");
CREATE INDEX "PositionAttribute_attributeId_idx" ON "PositionAttribute"("attributeId");
CREATE INDEX "AccessRule_positionId_idx" ON "AccessRule"("positionId");
CREATE INDEX "AccessRule_attributeId_idx" ON "AccessRule"("attributeId");
CREATE INDEX "PositionTag_tagId_idx" ON "PositionTag"("tagId");
CREATE INDEX "Cv_positionId_status_idx" ON "Cv"("positionId", "status");
CREATE INDEX "Cv_userId_updatedAt_idx" ON "Cv"("userId", "updatedAt");
CREATE UNIQUE INDEX "Cv_userId_positionId_key" ON "Cv"("userId", "positionId");
CREATE INDEX "CvProject_projectId_idx" ON "CvProject"("projectId");
CREATE INDEX "DiscussionPost_positionId_createdAt_idx" ON "DiscussionPost"("positionId", "createdAt");
CREATE INDEX "CvLike_userId_idx" ON "CvLike"("userId");

-- PostgreSQL-native full-text index used by the public position search.
CREATE INDEX "Position_search_idx" ON "Position" USING GIN (
    to_tsvector(
        'simple',
        coalesce("title", '') || ' ' || coalesce("company", '') || ' ' || coalesce("description", '')
    )
);

ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileAttributeValue" ADD CONSTRAINT "ProfileAttributeValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileAttributeValue" ADD CONSTRAINT "ProfileAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TechnologyTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionAttribute" ADD CONSTRAINT "PositionAttribute_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionAttribute" ADD CONSTRAINT "PositionAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccessRule" ADD CONSTRAINT "AccessRule_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessRule" ADD CONSTRAINT "AccessRule_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PositionTag" ADD CONSTRAINT "PositionTag_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionTag" ADD CONSTRAINT "PositionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TechnologyTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CvProject" ADD CONSTRAINT "CvProject_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CvProject" ADD CONSTRAINT "CvProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CvLike" ADD CONSTRAINT "CvLike_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CvLike" ADD CONSTRAINT "CvLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
