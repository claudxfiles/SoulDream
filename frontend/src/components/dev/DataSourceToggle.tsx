import { useDataSourceStore } from '@/store/dataSourceStore';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function DataSourceToggle() {
    const { useRealData, setUseRealData, moduleConfig, toggleModule } = useDataSourceStore();
    
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
        <Card className="fixed bottom-4 right-4 p-4 space-y-4 bg-white dark:bg-gray-800 shadow-lg z-50">
            <div className="flex items-center justify-between space-x-4">
                <span className="text-sm font-medium">
                    Fuente de Datos
                </span>
                <div className="flex items-center space-x-2">
                    <span className={`text-sm ${!useRealData ? 'font-bold' : ''}`}>Mock</span>
                    <Switch 
                        checked={useRealData} 
                        onCheckedChange={setUseRealData}
                    />
                    <span className={`text-sm ${useRealData ? 'font-bold' : ''}`}>Real</span>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Módulos en datos reales:
                </p>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(moduleConfig) as Array<keyof typeof moduleConfig>).map((module) => (
                        <Badge
                            key={module}
                            variant={moduleConfig[module] ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleModule(module)}
                        >
                            {module.charAt(0).toUpperCase() + module.slice(1)}
                        </Badge>
                    ))}
                </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-yellow-500 dark:text-yellow-400">
                    Modo Desarrollo Activo
                </p>
            )}
        </Card>
    );
} 