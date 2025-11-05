// ------------------------------
// Konfigurasi Supabase
// ------------------------------
const supabaseUrl = "https://grzqfhiwrytumirzbrql.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyenFmaGl3cnl0dW1pcnpicnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTg5NzksImV4cCI6MjA3NzkzNDk3OX0.PK57fNcDqDqJV9FPBiFjfudv7d1nZ9bymQFcLhAdPKY";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

console.log("🟢 Supabase initialized");

// ------------------------------
// Elemen DOM
// ------------------------------
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadBtn = document.getElementById("uploadBtn");

const authSection = document.getElementById("auth-section");
const uploadSection = document.getElementById("upload-section");

// ------------------------------
// Fungsi Login / Register
// ------------------------------
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    alert("❌ Login gagal: " + error.message);
  } else {
    alert("✅ Login berhasil!");
    showUpload();
  }
});

registerBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    alert("❌ Registrasi gagal: " + error.message);
  } else {
    alert("✅ Registrasi berhasil! Silakan login.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  authSection.style.display = "block";
  uploadSection.style.display = "none";
});

// ------------------------------
// Fungsi Upload Foto
// ------------------------------
uploadBtn.addEventListener("click", async () => {
  const fileInput = document.getElementById("photoInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("Pilih file terlebih dahulu!");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Kamu harus login terlebih dahulu!");
    return;
  }

  const filePath = `${user.id}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from("photos")
    .upload(filePath, file);

  if (error) {
    alert("❌ Gagal upload: " + error.message);
  } else {
    alert("✅ Upload berhasil!");
  }
});

// ------------------------------
// Fungsi tampilan
// ------------------------------
async function showUpload() {
  authSection.style.display = "none";
  uploadSection.style.display = "block";
}

// Cek sesi login saat load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) showUpload();

});
