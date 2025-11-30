const Logo = ({ className = "" }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">DH</span>
            </div>
            <span className="font-bold text-xl text-gray-900">
                De<span className="text-blue-600">H</span>ire
            </span>
        </div>
    );
};

export default Logo;

