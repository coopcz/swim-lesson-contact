-- SUCCESSFULLY RAN ON 10/12/25
-- Enable Row Level Security on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY; 
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id(user_uuid UUID)
RETURNS UUID AS $$
    SELECT org_id FROM org_members WHERE user_id = user_uuid LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Orgs policies
CREATE POLICY "Users can view their org"
ON orgs FOR SELECT
TO authenticated
USING (id = get_user_org_id(auth.uid()));

-- Org members policies
CREATE POLICY "Users can view members in their org"
ON org_members FOR SELECT
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins can insert org members"
ON org_members FOR INSERT
TO authenticated
WITH CHECK (
    org_id = get_user_org_id(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM org_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can update org members"
ON org_members FOR UPDATE
TO authenticated
USING (
    org_id = get_user_org_id(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM org_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Clients policies
CREATE POLICY "Users can view clients in their org"
ON clients FOR SELECT
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert clients in their org"
ON clients FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update clients in their org"
ON clients FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete clients in their org"
ON clients FOR DELETE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

-- Lessons policies
CREATE POLICY "Users can view lessons in their org"
ON lessons FOR SELECT
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert lessons in their org"
ON lessons FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update lessons in their org"
ON lessons FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete lessons in their org"
ON lessons FOR DELETE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

-- Enrollments policies
CREATE POLICY "Users can view enrollments in their org"
ON enrollments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.id = enrollments.lesson_id
        AND lessons.org_id = get_user_org_id(auth.uid())
    )
);

CREATE POLICY "Users can insert enrollments in their org"
ON enrollments FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.id = lesson_id
        AND lessons.org_id = get_user_org_id(auth.uid())
    )
);

CREATE POLICY "Users can update enrollments in their org"
ON enrollments FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.id = enrollments.lesson_id
        AND lessons.org_id = get_user_org_id(auth.uid())
    )
);

CREATE POLICY "Users can delete enrollments in their org"
ON enrollments FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.id = enrollments.lesson_id
        AND lessons.org_id = get_user_org_id(auth.uid())
    )
);

-- Message batches policies
CREATE POLICY "Users can view batches in their org"
ON message_batches FOR SELECT
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert batches in their org"
ON message_batches FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update batches in their org"
ON message_batches FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

-- Message outbox policies
CREATE POLICY "Users can view outbox in their org"
ON message_outbox FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM message_batches
        WHERE message_batches.id = message_outbox.batch_id
        AND message_batches.org_id = get_user_org_id(auth.uid())
    )
);

CREATE POLICY "Users can insert outbox in their org"
ON message_outbox FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM message_batches
        WHERE message_batches.id = batch_id
        AND message_batches.org_id = get_user_org_id(auth.uid())
    )
);

CREATE POLICY "Users can update outbox in their org"
ON message_outbox FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM message_batches
        WHERE message_batches.id = message_outbox.batch_id
        AND message_batches.org_id = get_user_org_id(auth.uid())
    )
);

-- Import mappings policies
CREATE POLICY "Users can view mappings in their org"
ON import_mappings FOR SELECT
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert mappings in their org"
ON import_mappings FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update mappings in their org"
ON import_mappings FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

-- Message templates policies
CREATE POLICY "Users can view templates in their org"
ON message_templates FOR SELECT
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert templates in their org"
ON message_templates FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update templates in their org"
ON message_templates FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete templates in their org"
ON message_templates FOR DELETE
TO authenticated
USING (org_id = get_user_org_id(auth.uid()));

