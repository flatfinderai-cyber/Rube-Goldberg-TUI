/**
 * ABOUTME: Hero section component for the Rube Goldberg website.
 * Features steampunk-inspired design with mascot, warm colors,
 * and AI agent orchestrator input form.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Gear icon SVG for steampunk styling.
 */
function GearIcon({ className }: { className?: string }) {
    return (
          <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={className}
                >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>svg>
        );
}

/**
 * Main Hero component with steampunk Rube Goldberg theme.
  */
export function Hero() {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('claude');
    const [selectedSkills, setSelectedSkills] = useState<string[]>(['web', 'file']);
  
    const models = [
      { id: 'claude', name: 'Claude Sonnet', icon: '🤖' },
      { id: 'gpt4', name: 'GPT-4', icon: '🧠' },
      { id: 'gemini', name: 'Gemini', icon: '✨' },
        ];
  
    const skills = [
      { id: 'web', name: 'Web Search', icon: '🌐' },
      { id: 'file', name: 'File System', icon: '📁' },
      { id: 'code', name: 'Code Execution', icon: '⚙️' },
      { id: 'api', name: 'API Calls', icon: '🔌' },
        ];
  
    return (
          <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100">
            {/* Background decorative gears */}
                <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-20 left-10 w-32 h-32 border-8 border-amber-800 rounded-full animate-spin-slow" />
                        <div className="absolute top-40 right-20 w-24 h-24 border-6 border-amber-700 rounded-full animate-spin-reverse" />
                        <div className="absolute bottom-32 left-1/4 w-40 h-40 border-8 border-amber-900 rounded-full animate-spin-slow" />
                </div>div>
          
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                  {/* Navigation */}
                        <nav className="flex items-center justify-between mb-16">
                                  <div className="flex items-center gap-2">
                                              <GearIcon className="w-8 h-8 text-amber-700" />
                                              <span className="text-2xl font-bold text-amber-900">Rube Goldberg</span>span>
                                  </div>div>
                                  <div className="flex items-center gap-6">
                                              <Link href="/docs" className="text-amber-800 hover:text-amber-600 transition-colors">
                                                            Docs
                                              </Link>Link>
                                              <Link href="/examples" className="text-amber-800 hover:text-amber-600 transition-colors">
                                                            Examples
                                              </Link>Link>
                                              <Link
                                                              href="https://github.com/flatfinderai-cyber/Rube-Goldberg-TUI"
                                                              className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-700 transition-colors"
                                                            >
                                                            <span>GitHub</span>span>
                                              </Link>Link>
                                  </div>div>
                        </nav>nav>
                
                  {/* Main Hero Content */}
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                          {/* Left side - Text and Form */}
                                  <div className="space-y-8">
                                              <div className="space-y-4">
                                                            <h1 className="text-5xl lg:text-6xl font-bold text-amber-900 leading-tight">
                                                                            AI Agent Loop
                                                                            <span className="block text-amber-600">Orchestrator</span>span>
                                                            </h1>h1>
                                                            <p className="text-xl text-amber-800 max-w-lg">
                                                                            Build complex workflows with simple natural language. 
                                                                            Watch your Rube Goldberg machine work its magic.
                                                            </p>p>
                                              </div>div>
                                  
                                    {/* Agent Orchestrator Form */}
                                              <div className="bg-white/80 backdrop-blur-sm border-2 border-amber-300 rounded-2xl p-6 shadow-xl">
                                                {/* Blueprint-style textarea */}
                                                            <div className="relative mb-6">
                                                                            <textarea
                                                                                                value={prompt}
                                                                                                onChange={(e) => setPrompt(e.target.value)}
                                                                                                placeholder="Describe your agent loop...
                                                            
                                                            e.g., 'Create a research agent that summarizes papers and posts key findings to Slack'"
                                                                                                className="w-full h-32 p-4 bg-amber-50/50 border-2 border-dashed border-amber-300 rounded-xl text-amber-900 placeholder:text-amber-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all resize-none"
                                                                                                style={{
                                                                                                                      backgroundImage: 'linear-gradient(#f5e6d3 1px, transparent 1px)',
                                                                                                                      backgroundSize: '100% 24px',
                                                                                                  }}
                                                                                              />
                                                                            <div className="absolute top-2 right-2 text-xs text-amber-400 font-mono">
                                                                                              BLUEPRINT
                                                                            </div>div>
                                                            </div>div>
                                              
                                                {/* Controls Row */}
                                                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                                              {/* Model Selector */}
                                                                            <div className="flex items-center gap-2">
                                                                                              <GearIcon className="w-4 h-4 text-amber-600" />
                                                                                              <select
                                                                                                                    value={selectedModel}
                                                                                                                    onChange={(e) => setSelectedModel(e.target.value)}
                                                                                                                    className="px-3 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg text-amber-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                                                                                                                  >
                                                                                                {models.map((model) => (
                                                                                                                                          <option key={model.id} value={model.id}>
                                                                                                                                            {model.icon} {model.name}
                                                                                                                                            </option>option>
                                                                                                                                        ))}
                                                                                                </select>select>
                                                                            </div>div>
                                                            
                                                              {/* Skills Toggles */}
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                              {skills.map((skill) => (
                                <button
                                                        key={skill.id}
                                                        onClick={() => {
                                                                                  setSelectedSkills((prev) =>
                                                                                                              prev.includes(skill.id)
                                                                                                                ? prev.filter((s) => s !== skill.id)
                                                                                                                : [...prev, skill.id]
                                                                                                            );
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                                                  selectedSkills.includes(skill.id)
                                                                                    ? 'bg-amber-600 text-white shadow-md'
                                                                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        }`}
                                                      >
                                  {skill.icon} {skill.name}
                                </button>button>
                              ))}
                                                                            </div>div>
                                                            </div>div>
                                              
                                                {/* Build Loop Button - Brass Lever Style */}
                                                            <button
                                                                              className="w-full py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 transform hover:scale-[1.02] transition-all active:scale-[0.98] border-2 border-amber-700"
                                                                              style={{
                                                                                                  boxShadow: '0 4px 0 #92400e, 0 6px 20px rgba(180, 83, 9, 0.3)',
                                                                              }}
                                                                            >
                                                                            <span className="flex items-center justify-center gap-2">
                                                                                              <GearIcon className="w-5 h-5 animate-spin-slow" />
                                                                                              Build Loop
                                                                                              <span className="text-amber-200">→</span>span>
                                                                            </span>span>
                                                            </button>button>
                                              </div>div>
                                  
                                    {/* Quick Stats */}
                                              <div className="flex gap-8 text-amber-800">
                                                            <div>
                                                                            <div className="text-2xl font-bold">∞</div>div>
                                                                            <div className="text-sm opacity-75">Possibilities</div>div>
                                                            </div>div>
                                                            <div>
                                                                            <div className="text-2xl font-bold">4</div>div>
                                                                            <div className="text-sm opacity-75">Step Loop</div>div>
                                                            </div>div>
                                                            <div>
                                                                            <div className="text-2xl font-bold">100%</div>div>
                                                                            <div className="text-sm opacity-75">Open Source</div>div>
                                                            </div>div>
                                              </div>div>
                                  </div>div>
                        
                          {/* Right side - Mascot */}
                                  <div className="relative flex items-center justify-center">
                                              <div className="relative w-full max-w-md">
                                                {/* Decorative frame */}
                                                            <div className="absolute inset-0 border-4 border-amber-400 rounded-3xl transform rotate-3 opacity-50" />
                                                            <div className="absolute inset-0 border-4 border-amber-300 rounded-3xl transform -rotate-2 opacity-30" />
                                                            
                                                {/* Mascot Image Placeholder */}
                                                            <div className="relative bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl p-8 shadow-2xl border-2 border-amber-300">
                                                                            <div className="aspect-square bg-amber-50 rounded-xl flex items-center justify-center border-2 border-dashed border-amber-300">
                                                                              {/* Replace with actual mascot image */}
                                                                                              <div className="text-center p-8">
                                                                                                                  <div className="text-8xl mb-4">🐱</div>div>
                                                                                                                  <p className="text-amber-600 font-medium">
                                                                                                                                        Rube the Cat
                                                                                                                    </p>p>
                                                                                                                  <p className="text-amber-500 text-sm">
                                                                                                                                        Master Orchestrator
                                                                                                                    </p>p>
                                                                                                </div>div>
                                                                            </div>div>
                                                                            
                                                              {/* Floating gear decorations */}
                                                                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                                                                              <GearIcon className="w-6 h-6 text-white animate-spin-slow" />
                                                                            </div>div>
                                                                            <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                                                                                              <GearIcon className="w-5 h-5 text-white animate-spin-reverse" />
                                                                            </div>div>
                                                            </div>div>
                                              </div>div>
                                  </div>div>
                        </div>div>
                
                  {/* Tagline */}
                        <div className="text-center mt-16">
                                  <p className="text-lg text-amber-700 italic">
                                              "Where complexity becomes orchestration"
                                  </p>p>
                        </div>div>
                </div>div>
          
            {/* Custom CSS for animations */}
                <style jsx>{`
                        @keyframes spin-slow {
                                  from { transform: rotate(0deg); }
                                            to { transform: rotate(360deg); }
                                                    }
                                                            @keyframes spin-reverse {
                                                                      from { transform: rotate(360deg); }
                                                                                to { transform: rotate(0deg); }
                                                                                        }
                                                                                                .animate-spin-slow {
                                                                                                          animation: spin-slow 20s linear infinite;
                                                                                                                  }
                                                                                                                          .animate-spin-reverse {
                                                                                                                                    animation: spin-reverse 15s linear infinite;
                                                                                                                                            }
                                                                                                                                                  `}</style>style>
          </section>section>
        );
}</svg>
