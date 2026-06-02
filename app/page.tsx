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
            Quản lý chi tiêu
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              phòng trọ dễ dàng
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
            Ghi lại mọi khoản chi chung, tự động chia tiền và biết ngay ai
            còn nợ ai.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-200/60 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300/60"
            >
              Bắt đầu sử dụng
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-400 hover:text-emerald-700 hover:shadow-md"
            >
              Xem tính năng
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
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
            Đơn giản nhưng đầy đủ
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                📝
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Ghi khoản chi
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Tiền trọ, tiền điện, tiền nước, đồ ăn chung, đồ dùng sinh
                hoạt — ghi lại nhanh chóng chỉ trong vài giây.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-2xl">
                ⚡
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Chia tiền tự động
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Hệ thống tự động tính toán ai cần trả ai, bao nhiêu. Không
                cần bấm máy tính, không nhầm lẫn.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/50 sm:col-span-2 lg:col-span-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
                📊
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Tổng kết cuối tháng
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Báo cáo chi tiêu theo tháng, biết rõ ai đã trả, ai còn nợ.
                Minh bạch, rõ ràng.
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-semibold text-emerald-800">
                Khoản chi mới
              </span>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Who paid */}
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-sm">
                  P
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Phú</p>
                  <p className="text-sm text-gray-500">
                    đã chi{" "}
                    <span className="font-bold text-emerald-600">
                      90.000đ
                    </span>{" "}
                    cho <span className="font-medium text-gray-700">Đồ dùng chung</span>
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-dashed border-gray-200" />

              {/* Split result */}
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Chia đều cho 3 người
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      Q
                    </span>
                    <span className="font-medium text-gray-800">Quang</span>
                  </div>
                  <span className="font-bold text-rose-500">
                    −30.000đ
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                      H
                    </span>
                    <span className="font-medium text-gray-800">Hiếu</span>
                  </div>
                  <span className="font-bold text-rose-500">
                    −30.000đ
                  </span>
                </div>
              </div>

              {/* Bottom note */}
              <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-center">
                <p className="text-sm text-emerald-800">
                  Quang và Hiếu mỗi người cần trả Phú{" "}
                  <span className="font-bold">30.000đ</span>
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
            Quản lý chi tiêu chung cho phòng trọ
          </p>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} TroMate. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
