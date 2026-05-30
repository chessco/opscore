export default function DashboardPage() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Dispositivos Online</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Alertas Activas</h3>
                    <p className="text-3xl font-bold text-red-500 mt-2">2</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Operadores Conectados</h3>
                    <p className="text-3xl font-bold text-blue-500 mt-2">5</p>
                </div>
            </div>
        </div>
    );
}
