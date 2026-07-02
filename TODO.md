# TODO - Slughub route tree restructuring

## Step 1: Inspect existing entry files
- [x] Read `app/layout.tsx`
- [x] Read `app/page.tsx`
- [x] Read `package.json`

## Step 2: Create route groups and stub pages (no logic)
- [x] Create `app/(auth)/layout.tsx`
- [x] Create `app/(auth)/login/page.tsx`
- [x] Create `app/(auth)/register/page.tsx`
- [x] Create `app/(auth)/forgot-password/page.tsx`


## Step 3: Create dashboard route tree (admin/hod/lecturer/dean/exam-officer/student)
- [x] Create `app/(dashboard)/layout.tsx`

- [ ] Create all `page.tsx` files listed in the template under each role

## Step 4: Create API route tree
- [ ] Create `app/api/.../route.ts` files listed in the template under each resource

## Step 5: Ensure compilation
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Run `npm run dev` (optional)

