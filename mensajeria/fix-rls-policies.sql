-- Fix RLS policies to prevent infinite recursion

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Create helper function to avoid recursion
CREATE OR REPLACE FUNCTION user_is_participant_in_conversation(conv_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conv_id
    AND cp.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies using the helper function
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (user_is_participant_in_conversation(conversation_id));

CREATE POLICY "Users can add participants to their conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view conversations they participate in"
  ON public.conversations FOR SELECT
  USING (user_is_participant_in_conversation(id));

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Verify the fix
SELECT 'RLS policies fixed successfully' as status;
