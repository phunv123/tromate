import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-md shadow-emerald-200/60 transition-transform group-hover:scale-105">
              T
            </span>
            <span className="text-xl font-bold text-gray-900">
              Tro<span className="text-emerald-600">Mate</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
            >
              Đăng ký
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-white px-5 py-24 text-center sm:py-32">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          {/* Badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Miễn phí cho sinh viên
          </span>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Hết cãi nhau vì
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              quên lượt mua đồ
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
            Tự động xoay vòng lượt mua đồ dùng chung cho phòng trọ.
            Biết ngay đến lượt ai mua gì — không tranh cãi, không quên.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-200/60 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300/60"
            >
              Bắt đầu sử dụng
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-400 hover:text-emerald-700 hover:shadow-md"
            >
              Xem cách hoạt động
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="bg-gray-50/70 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Tính năng nổi bật
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            Đơn giản mà hiệu quả
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                🔄
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Xoay vòng tự động
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Hệ thống tự động xoay lượt mua cho từng sản phẩm.
                Phú mua xong → đến Quang → đến Hiếu → quay lại Phú.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-2xl">
                🚨
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Báo hết hàng nhanh
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Ai thấy đồ sắp hết thì bấm báo. App hiện ngay
                đến lượt ai phải đi mua — rõ ràng, không tranh cãi.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/50 sm:col-span-2 lg:col-span-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
                📊
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Thống kê minh bạch
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Biết rõ ai đã bỏ tiền mua bao nhiêu trong tháng.
                Minh bạch, công bằng — ai cũng tâm phục khẩu phục.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Example ──────────────────────────────────────────── */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Ví dụ minh hoạ
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            Xem cách hoạt động
          </h2>

          {/* Example card */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
            {/* Top bar */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-emerald-50 px-6 py-3.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-emerald-800">
                Vòng xoay lượt mua
              </span>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Product */}
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-3xl shadow-sm">
                  🍶
                </span>
                <div>
                  <p className="text-xl font-bold text-gray-900">Nước mắm Nam Ngư</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Mua gần nhất: <span className="font-semibold text-gray-700">Phú</span> — cách đây 5 ngày
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-dashed border-gray-200" />

              {/* Rotation */}
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Vòng xoay 3 thành viên
              </p>
              <div className="flex items-center justify-center gap-3">
                {/* Phú - done */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-500 line-through">
                    P
                  </span>
                  <span className="text-xs text-gray-400 line-through">Phú</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">✅ Đã mua</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {/* Quang - current turn */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-md shadow-amber-200 ring-2 ring-amber-300 ring-offset-2">
                    Q
                  </span>
                  <span className="text-xs font-bold text-amber-700">Quang</span>
                  <span className="text-[10px] text-amber-600 font-bold">⚡ Lượt mua!</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {/* Hiếu - next */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                    H
                  </span>
                  <span className="text-xs text-gray-500">Hiếu</span>
                  <span className="text-[10px] text-gray-400">Chờ lượt</span>
                </div>
              </div>

              {/* Bottom note */}
              <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-center">
                <p className="text-sm text-amber-800">
                  🍶 Nước mắm đã hết — <span className="font-bold">Quang</span> cần đi mua!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-center">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              T
            </span>
            <span className="font-bold text-gray-800">TroMate</span>
          </div>
          <p className="text-sm text-gray-500">
            Xoay vòng lượt mua đồ dùng chung cho phòng trọ
          </p>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} TroMate. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
