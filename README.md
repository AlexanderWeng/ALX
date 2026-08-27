# ALX-PLAN

เว็บแอป **Mind Plan + Task Board** ธีม Modern White Sci-Fi ใช้งานได้ทั้งบนคอมและมือถือ ไม่ต้องมี build step — เป็น HTML/CSS/JS ล้วน เปิดไฟล์แล้วรันได้ทันที ข้อมูลบันทึกอัตโนมัติในเบราว์เซอร์ (localStorage) และเชื่อมข้ามอุปกรณ์ได้แบบออปชันนัลผ่าน Supabase (ดูด้านล่าง)

พัฒนาโดย **Alexander_Weng**

## ฟีเจอร์หลัก

- **Mind Plan** — แผนที่ความคิดแบบ constellation, pan/zoom ไม่จำกัดพื้นที่ (ไม่มีขอบเขต), รองรับหลายแผนพร้อมกัน (plan bar ด้านบน canvas)
- **โหนดความคิด** — เลือกไอคอนได้ 12 แบบ, ตั้งสีเองแบบ RGB/HEX + ระบบสีโปรด (fav color) ที่ auto-generate 5 shade ให้, กำหนด % ความคืบหน้าเอง (หรือให้คำนวณอัตโนมัติจากงานในกิ่ง), toggle "กำลังดำเนินการอยู่", และตั้ง **กำหนดเวลา (due date)** ได้ — โหนดจะโชว์ป้ายสีเตือนอัตโนมัติ (เหลือง = ใกล้ถึง, ส้ม = วันนี้, แดง = เลยกำหนด)
- **เชื่อม/ตัดกิ่งด้วยการลาก** — ทุกโหนด (ที่ไม่ใช่ศูนย์กลาง) มีจุดสีเล็ก ๆ ที่มุมขวาล่าง ลากจุดนั้นไปวางบนโหนดอื่นเพื่อย้ายกิ่งไปต่อที่นั่น หรือปล่อยบนพื้นที่ว่างเพื่อตัดการเชื่อม ระบบกันไม่ให้ต่อแบบวนลูป (loop) ให้อัตโนมัติ
- **จัดเรียงอัตโนมัติ** — จัดผังทั้งหมดใหม่แบบ radial ไม่ทับกัน กำหนดตำแหน่งแน่นอนทุกครั้ง (ไม่สุ่ม)
- **Task Board** — คอลัมน์ Task → Doing → Done ลากการ์ดข้ามคอลัมน์บนคอม หรือกดปุ่มลูกศรบนมือถือ กรองงานตามแผนได้ และมี % ความคืบหน้ารวม
- **Sync ข้ามอุปกรณ์ผ่าน Supabase (ออปชันนัล)** — ใส่ Supabase URL + anon key ของตัวเอง แล้วกด "สร้างรหัสเชื่อมต่อ" จะได้รหัส 6 หลัก เอารหัสนั้นไปกรอกที่อุปกรณ์อื่น (เช่นโทรศัพท์) เพื่อ join แผนเดียวกัน จะเห็นสถานะการเชื่อมต่อที่มุมขวาบนตลอดเวลา และข้อมูลจะซิงก์แบบเรียลไทม์

## ไฟล์ในโปรเจกต์
```
index.html          โครงหน้าเว็บ (plan bar, node modal, plan modal, sync modal)
style.css            ธีม modern white sci-fi + responsive + saturn-ring logo animation
app.js               โลจิกทั้งหมด (multi-plan mind map, node types, task linking, Supabase sync)
favicon.svg          ไอคอนเว็บ/โลโก้ (static version ของ saturn-ring ใน header)
site.webmanifest     ทำให้ "เพิ่มลงหน้าจอโฮม" บนมือถือได้เหมือนแอป
```
ไม่มี dependency ที่ต้องติดตั้งล่วงหน้า — ไลบรารี Supabase client จะถูกโหลดจาก CDN อัตโนมัติเฉพาะตอนเปิดใช้ sync เท่านั้น

## วิธี deploy ขึ้น GitHub Pages

1. สร้าง repository ใหม่บน GitHub (เช่น `alx-plan`)
2. อัปโหลดไฟล์ทั้งหมด (`index.html`, `style.css`, `app.js`, `favicon.svg`, `site.webmanifest`) ขึ้น repo:
   ```bash
   git init
   git add .
   git commit -m "ALX-PLAN"
   git branch -M main
   git remote add origin https://github.com/<username>/alx-plan.git
   git push -u origin main
   ```
3. เข้าไปที่ repo → **Settings → Pages**
4. ที่หัวข้อ **Build and deployment** เลือก Source เป็น **Deploy from a branch**
5. เลือก branch `main` และโฟลเดอร์ `/ (root)` แล้วกด **Save**
6. รอ 1–2 นาที เว็บจะขึ้นที่ `https://<username>.github.io/alx-plan/`

> **สำคัญ — เรื่องแคช:** ทุกครั้งที่แก้ไฟล์แล้ว push ใหม่ เบราว์เซอร์ (โดยเฉพาะมือถือ) มักจะแคช `app.js`/`style.css` ไฟล์เก่าไว้ ทำให้ดูเหมือนบั๊กเดิม "ไม่หายสักที" ทั้งที่จริงแก้แล้ว วิธีแก้: เปลี่ยนเลขท้าย `?v=` ใน `index.html` (บรรทัดที่ลิงก์ `style.css?v=3` และ `app.js?v=3`) เป็นเลขใหม่ทุกครั้งที่ deploy หรือ hard refresh หน้าเว็บ (Ctrl/Cmd+Shift+R) ก่อนเช็คว่าบั๊กหายหรือยัง

### ต่อโดเมนของตัวเอง (custom domain)
ใน Settings → Pages ใส่โดเมนของคุณในช่อง **Custom domain** แล้วไปตั้งค่า DNS ที่ผู้ให้บริการโดเมน:
- ใช้ subdomain (เช่น `app.yourdomain.com`) → เพิ่ม CNAME record ชี้ไปที่ `<username>.github.io`
- ใช้ root domain (เช่น `yourdomain.com`) → เพิ่ม A record ชี้ไปที่ IP ของ GitHub Pages (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`)

## ตั้งค่า Supabase สำหรับ sync ข้ามอุปกรณ์

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com) (ฟรีได้)
2. ไปที่ **SQL Editor** แล้วรันสคริปต์นี้เพื่อสร้างตารางและเปิด realtime:
   ```sql
   create table if not exists mindplans (
     code text primary key,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table mindplans enable row level security;

   -- อนุญาตให้ทุกคนที่มีรหัส (anon key) อ่าน/เขียนแถวของตัวเองได้
   -- (โมเดลนี้พึ่งความยากของการเดารหัส 6 หลักเป็นตัวป้องกัน ไม่ใช่ auth
   --  เหมาะกับใช้ส่วนตัว/กลุ่มเล็ก ถ้าต้องการความปลอดภัยสูงกว่านี้
   --  ให้เพิ่มระบบ auth ของ Supabase แล้วผูก policy กับ user_id แทน)
   create policy "anyone can read a plan by code"
     on mindplans for select
     using (true);

   create policy "anyone can upsert a plan by code"
     on mindplans for insert
     with check (true);

   create policy "anyone can update a plan by code"
     on mindplans for update
     using (true);

   alter publication supabase_realtime add table mindplans;
   ```
3. ไปที่ **Project Settings → API** คัดลอก **Project URL** และ **anon public key**
4. เปิด ALX-PLAN → กดไอคอน sync มุมขวาบน → ใส่ URL + anon key ที่ "ขั้นตอนที่ 1" แล้วกด "บันทึกการตั้งค่า"
5. เครื่องแรก กด **"สร้างรหัสเชื่อมต่อใหม่"** จะได้รหัส 6 หลัก
6. เครื่องที่สอง (เช่นโทรศัพท์) — เปิดเว็บเดียวกัน ทำข้อ 3–4 ซ้ำ (ต้องใส่ URL/anon key **ชุดเดียวกัน**) แล้วเอารหัสจากข้อ 5 มากรอกช่อง **"เข้าร่วม"**
7. ทั้งสองเครื่องจะซิงก์ข้อมูลกันแบบเรียลไทม์ทันที และเห็นสถานะรหัสที่กำลังเชื่อมต่ออยู่ที่มุมขวาบนตลอด

หมายเหตุ: URL/anon key ถูกเก็บไว้เฉพาะใน localStorage ของเบราว์เซอร์นั้น ๆ ไม่ได้ถูกส่งไปเก็บที่ไหนอื่น และ anon key ของ Supabase ถูกออกแบบมาให้ฝังในฝั่ง client ได้อยู่แล้ว (ความปลอดภัยจริงมาจาก RLS policy ด้านบน)

## ข้อจำกัดที่ควรรู้
- ถ้าไม่ได้ตั้งค่า Supabase เว็บจะทำงานแบบออฟไลน์ล้วน ๆ ข้อมูลอยู่แค่ในเบราว์เซอร์เครื่องนั้น
- โมเดล sync ปัจจุบันใช้รหัส 6 หลักแทนระบบ login/บัญชีผู้ใช้ เหมาะกับใช้คนเดียวหรือกลุ่มเล็กที่ไว้ใจกัน ไม่เหมาะกับข้อมูลที่ต้องการการควบคุมสิทธิ์แบบละเอียด
