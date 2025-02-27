function BottomBar() {
    return (
      <footer className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-purple-900 border-t border-cyan-500/30 py-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-8 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute -top-8 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>
  
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold">SE</span>
              </div>
              <span className="text-white text-lg font-medium">SpeakEval</span>
            </div>
  
            <div className="text-center md:text-left">
              <p className="text-cyan-200 text-sm">Created by Ankith Prabhakar with Nikunj Bafna</p>
              <p className="text-cyan-300/70 text-xs mt-1">
                © {new Date().getFullYear()} SpeakEval. All rights reserved.
              </p>
            </div>
  
            <div className="flex space-x-4">
            </div>
          </div>
        </div>
      </footer>
    )
  }
  
  export default BottomBar
  
  