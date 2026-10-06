import { createFileRoute, Link } from "@tanstack/react-router";

import { Brain, Target, ArrowRight, Zap, CheckCircle2, Layers, Star} from 'lucide-react';

export const Route = createFileRoute("/")({ 
    component: () => <App />,
    ssr : true,
});

function App() {

    return (
        <div className="min-h-screen bg-bg1 text-foreground selection:bg-amber-400 selection:text-black">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-border bg-bg2/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <span className="text-2xl font-irish-grover tracking-wider text-foreground">Course Architect</span>
                    </div>

                    <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <a href="#how" className="hover:text-primary hidden sm:flex transition-colors">Methodology</a>
                        <Link to="/app/course/create" className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25">
                            Start Building
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden bg-bg1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-600 border border-amber-400/20 text-xs font-bold tracking-wider uppercase">
                            <Zap className="w-3 h-3 fill-current" /> AI-Driven Personalization
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Learn <span className="text-primary underline decoration-amber-400 underline-offset-8">anything</span> through the power of AI.
                        </h1>
                        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Tell us your goal, your current skills, and your target expertise. We'll architect a custom curriculum designed specifically for your brain.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/app/course/create" className="bg-amber-400 text-primary-foreground px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                                Create My Course <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/app/course" className="border-amber-400 border-2 text-primary-foreground px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                                View Course Library
                            </Link>
                        </div>
                        <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-bg1 bg-muted flex items-center justify-center text-[10px] font-bold">U{i}</div>
                                ))}
                            </div>
                            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400 border-none" /> 4.9/5 by 20k+ learners</span>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-3xl group-hover:bg-primary/20 transition-all" />
                        <div className="relative bg-bg2 border border-border rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-sm">
                            <div className="space-y-8">
                                {/* Topic Field Mock */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold tracking-tight">Topic</label>
                                    <div className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-muted-foreground/70 flex items-center">
                                        {"e.g., Quantum Entanglement"}
                                    </div>
                                </div>

                                {/* User Context Mock */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold tracking-tight">User Context</label>
                                    <div className="w-full bg-input border border-border rounded-md px-3 py-3 text-sm text-muted-foreground/70 min-h-[120px]">
                                        {"Briefly describe your current knowledge or objective..."}
                                    </div>
                                </div>

                                {/* Depth Level Mock */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-sm font-semibold tracking-tight">Depth Level</label>
                                        <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-secondary-foreground border border-border">
                                        {"Surface Level"}
                                        </span>
                                    </div>
                                    <div className="px-1 relative">
                                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="bg-primary h-full transition-all duration-300" 
                                            style={{ width: `0%` }}
                                        />
                                        </div>
                                        {/* Visual Thumb representation */}
                                        <div 
                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm transition-all duration-300"
                                        style={{ left: `0% - 8px)` }}
                                        />
                                    </div>
                                    <div className="flex justify-between w-full px-1 text-[10px] uppercase font-medium text-muted-foreground tracking-widest">
                                        <span>Intro</span>
                                        <span>Expert</span>
                                    </div>
                                </div>

                                {/* Action Area Mock */}
                                <div className="pt-4 flex justify-end">
                                    <div
                                        className="bg-primary text-primary-foreground px-8 py-2 rounded-md font-semibold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        {"Create"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Bar */}
            <section className="py-12 border-y border-border bg-bg2">
                <div className="max-w-7xl mx-auto px-6 overflow-hidden">
                    <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">Empowering future experts at</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
                        {['GLUBAL-ED', 'LIARN-FLOW', 'SKELL-SYNC', 'MEND-GRID', 'APAX'].map(brand => (
                            <span key={brand} className="text-2xl font-black tracking-tighter hover:text-primary transition-colors">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Methodology Section */}
            <section id="how" className="py-24 px-6 relative bg-bg1">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How we architect your <span className="font-irish-grover text-primary">path</span></h2>
                            <p className="text-muted-foreground leading-relaxed">Most platforms give you a static video player. We give you a living curriculum that adapts to your pace.</p>
                            <ul className="space-y-3 pt-4">
                                {['Zero content overlap', 'Adaptive skill testing', 'Real-world project focus'].map(text => (
                                <li key={text} className="flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-primary" /> {text}
                                </li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                            {[
                                { title: "Input Your Specs", desc: "Tell us exactly what you want to learn. No topic is too niche for our engine.", icon: <Target className="w-6 h-6" /> },
                                { title: "Skill Baseline Audit", desc: "We identify exactly what you already know so you never waste a second on basics.", icon: <Brain className="w-6 h-6" /> },
                                { title: "AI Generation", desc: "Our AI compiles videos, articles, and interactive labs into a cohesive path.", icon: <Layers className="w-6 h-6" /> },
                                { title: "Continuous Tuning", desc: "As you progress, the course difficulty adjusts based on your quiz performance.", icon: <Zap className="w-6 h-6" /> }
                            ].map((card, i) => (
                                <div key={i} className="group p-8 rounded-3xl bg-bg2 border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
                                    <div className="w-12 h-12 rounded-2xl bg-bg1 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary transition-all">
                                        <div className="text-primary group-hover:text-primary-foreground transition-colors">{card.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Call to Action */}
            <section className="py-24 px-6 bg-bg1">
                <div className="max-w-5xl mx-auto rounded-[3rem] bg-primary p-12 md:p-20 text-center text-primary-foreground relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 relative z-10">Start your Course Architect today.</h2>
                    <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
                        Stop drowning in bookmarks. Get one focused, AI-architected path that actually gets you to expert status.
                    </p>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/app/course/create" className="bg-bg1 text-foreground px-10 py-4 rounded-2xl font-bold text-lg hover:bg-bg2 transition-all shadow-lg">
                            Generate Now — It's Free
                        </Link>
                        <Link to="/app/course" className="bg-transparent border border-primary-foreground/20 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-primary-foreground/10 transition-all">
                            See Sample Course
                        </Link>
                    </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-400/20 blur-3xl rounded-full" /></div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-border bg-bg2">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
                    <div className="col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-irish-grover tracking-wider">Course Architect</span>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                            The world's first truly personalized learning engine. Created for experts, by AI.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold uppercase text-xs tracking-widest text-primary">Learning</h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li><Link to="/app/course" className="hover:text-primary">Course Gallery</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold uppercase text-xs tracking-widest text-primary">Support</h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li><a href="http://github.com/syed-minhaj/everything-course" className="hover:text-primary">Documentation</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                    <span>© 2026 Course Architect — AI Learning Revolution.</span>
                </div>
            </footer>
        </div>
    );
};


