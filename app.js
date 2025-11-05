console.log("🔴 JavaScript file loaded!");

// Supabase Configuration
const supabaseUrl = "https://grzqfhiwrytumirzbrql.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyenFmaGl3cnl0dW1pcnpicnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTg5NzksImV4cCI6MjA3NzkzNDk3OX0.PK57fNcDqDqJV9FPBiFjfudv7d1nZ9bymQFcLhAdPKY";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
console.log("🟢 Supabase initialized");

// DOM Elements
const loginSection = document.getElementById("loginSection");
const uploadSection = document.getElementById("uploadSection");
const userEmail = document.getElementById("userEmail");
const loginMessage = document.getElementById("loginMessage");
const uploadMessage = document.getElementById("uploadMessage");
const photoGallery = document.getElementById("photoGallery");

// ---------------- AUTH ----------------
checkAuthState();

async function checkAuthState() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) showUploadSection(session.user);
  else showLoginSection();
}

function showLoginSection() {
  loginSection.style.display = "block";
  uploadSection.style.display = "none";
}

function showUploadSection(user) {
  loginSection.style.display = "none";
  uploadSection.style.display = "block";
  userEmail.textContent = user.email;
  loadUserPhotos(user.id);
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) showMessage(loginMessage, `Login gagal: ${error.message}`, "error");
  else {
    showMessage(loginMessage, "Login berhasil!", "success");
    checkAuthState();
  }
}

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) showMessage(loginMessage, `Daftar gagal: ${error.message}`, "error");
  else showMessage(loginMessage, "Pendaftaran berhasil! Cek email verifikasi.", "success");
}

async function logout() {
  await supabase.auth.signOut();
  showLoginSection();
}

// ---------------- UPLOAD ----------------
async function uploadPhotos() {
  const fileInput = document.getElementById("photoInput");
  const files = fileInput.files;

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return showMessage(uploadMessage, "Silakan login dulu!", "error");
  if (files.length === 0) return showMessage(uploadMessage, "Pilih foto dulu!", "error");

  let successCount = 0;
  for (let file of files) {
    const ok = await uploadSingleFile(file, user);
    if (ok) successCount++;
  }
  fileInput.value = "";
  loadUserPhotos(user.id);
  showMessage(uploadMessage, `Berhasil upload ${successCount} foto`, "success");
}

async function uploadSingleFile(file, user) {
  if (!file.type.startsWith("image/")) return false;
  const path = `${user.id}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
  if (uploadErr) {
    console.error(uploadErr);
    return false;
  }

  await supabase.from("photos_meta").insert({ user_id: user.id, file_path: path });
  console.log("🟢 Uploaded:", path);
  return true;
}

// ---------------- GALLERY ----------------
async function loadUserPhotos(userId) {
  console.log("🟡 Memuat foto user:", userId);
  photoGallery.innerHTML = '<p style="color: blue;">🔄 Memuat foto...</p>';

  const { data, error } = await supabase
    .from("photos_meta")
    .select("id, file_path")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    photoGallery.innerHTML = '<p style="color:red;">Gagal memuat foto.</p>';
    return;
  }

  if (!data?.length) {
    photoGallery.innerHTML = '<p>Belum ada foto 📸</p>';
    return;
  }

  photoGallery.innerHTML = "";
  data.forEach(row => tampilkanFoto(row, userId));
}

function tampilkanFoto(row, userId) {
  const url = `${supabaseUrl}/storage/v1/object/public/photos/${row.file_path}`;
  const container = document.createElement("div");
  container.className = "photo-item";
  container.style.position = "relative";
  container.style.display = "inline-block";
  container.style.margin = "10px";

  const img = document.createElement("img");
  img.src = url;
  img.alt = row.file_path;
  img.style.width = "150px";
  img.style.height = "150px";
  img.style.objectFit = "cover";
  img.style.borderRadius = "8px";
  img.style.border = "2px solid #ddd";
  img.style.cursor = "pointer";
  img.onclick = () => lihatFull(url);

  const btnGroup = document.createElement("div");
  btnGroup.style.marginTop = "5px";
  btnGroup.style.textAlign = "center";

  const btnDownload = document.createElement("button");
  btnDownload.textContent = "⬇️";
  btnDownload.title = "Download";
  btnDownload.onclick = () => window.open(url, "_blank");

  const btnDelete = document.createElement("button");
  btnDelete.textContent = "🗑️";
  btnDelete.title = "Hapus";
  btnDelete.onclick = () => hapusFoto(row, userId, container);

  [btnDownload, btnDelete].forEach(btn => {
    btn.style.margin = "3px";
    btn.style.padding = "5px 8px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.style.background = "#eee";
  });

  btnGroup.appendChild(btnDownload);
  btnGroup.appendChild(btnDelete);
  container.appendChild(img);
  container.appendChild(btnGroup);
  photoGallery.appendChild(container);
}

// ---------------- DELETE ----------------
async function hapusFoto(row, userId, container) {
  if (!confirm("Yakin ingin menghapus foto ini?")) return;

  // hapus dari storage
  const { error: delErr } = await supabase.storage.from("photos").remove([row.file_path]);
  if (delErr) {
    alert("Gagal hapus dari storage: " + delErr.message);
    return;
  }

  // hapus dari database
  const { error: dbErr } = await supabase.from("photos_meta").delete().eq("file_path", row.file_path);
  if (dbErr) {
    alert("Gagal hapus dari database: " + dbErr.message);
    return;
  }

  container.remove();
  alert("Foto berhasil dihapus!");
}

// ---------------- FULLSCREEN VIEW ----------------
function lihatFull(url) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";

  const img = document.createElement("img");
  img.src = url;
  img.style.maxWidth = "90%";
  img.style.maxHeight = "90%";
  img.style.borderRadius = "10px";
  img.style.boxShadow = "0 0 10px white";

  overlay.appendChild(img);
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

// ---------------- UTILITIES ----------------
function showMessage(element, message, type) {
  element.textContent = message;
  element.className = type;
  element.style.display = "block";
  setTimeout(() => (element.style.display = "none"), 4000);
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session) showUploadSection(session.user);
  else if (event === "SIGNED_OUT") showLoginSection();
});

console.log("🎯 app.js siap digunakan!");