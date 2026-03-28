-- PHASE 16 Q1: Role distribution overview
SELECT role, COUNT(*) AS total
FROM public.users
GROUP BY role
ORDER BY role;
