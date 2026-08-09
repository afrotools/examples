-- Fixes the "Function Search Path Mutable" security lint on set_updated_at():
-- without a fixed search_path, the function is vulnerable to search_path
-- hijacking. It doesn't reference any unqualified tables, so an empty
-- search_path is safe here.

alter function set_updated_at() set search_path = '';
