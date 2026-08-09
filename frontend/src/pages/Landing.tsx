import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#020b16] text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-10 md:px-6 lg:px-8">
        <header className="mb-10 rounded-[30px] border border-slate-700/80 bg-slate-950/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">CivicShield AI</p>
              <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">Smart city operations, redesigned.</h1>
            </div>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              AI engine online
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-700/80 bg-slate-950/60 p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Mission overview</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold text-white md:text-5xl">
              From citizen reports to smarter infrastructure decisions.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              CivicShield AI uses computer vision and intelligent prioritization to detect, verify, and route civic issues faster across the city.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/report" className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-500/15">
                Report an issue
              </Link>
              <Link to="/dashboard" className="rounded-2xl border border-slate-600 bg-slate-900/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-slate-500 hover:bg-slate-800">
                Authority dashboard
              </Link>
              <Link to="/track" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-500/15">
                Citizen tracking
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-[28px] border border-slate-700/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">City health</p>
              <div className="mt-3 text-4xl font-semibold text-white">98.6%</div>
              <p className="mt-2 text-sm text-slate-300">System resilience across civic services.</p>
            </div>
            <div className="glass-panel rounded-[28px] border border-slate-700/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Active issues</p>
              <div className="mt-3 text-4xl font-semibold text-white">83</div>
              <p className="mt-2 text-sm text-slate-300">Priority incidents currently monitored.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
