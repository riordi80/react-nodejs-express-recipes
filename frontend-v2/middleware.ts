import { NextRequest, NextResponse } from 'next/server'

/**
 * Obtiene el dominio base de las variables de entorno
 * @returns el dominio base configurado
 */
function getBaseDomain(): string {
  // Prioridad: NEXT_PUBLIC_TENANT_BASE_URL > TENANT_BASE_URL > fallback
  return process.env.NEXT_PUBLIC_TENANT_BASE_URL || 
         process.env.TENANT_BASE_URL || 
         'ordidev.com'
}

/**
 * Determina si el hostname es el dominio principal (sin subdominio tenant)
 * @param hostname - El hostname de la request
 * @returns true si es dominio principal
 */
function isMainDomain(hostname: string | null): boolean {
  if (!hostname) return false
  
  // Remover puerto si existe
  const cleanHostname = hostname.split(':')[0]
  
  // Para desarrollo local
  if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
    return true
  }
  
  const baseDomain = getBaseDomain()
  const parts = cleanHostname.split('.')
  const domainParts = baseDomain.split('.')
  
  // Si es exactamente el dominio base (ej: ordidev.com)
  if (parts.length === domainParts.length && 
      parts.join('.') === baseDomain) {
    return true
  }
  
  // Si es www.dominio.com
  if (parts.length === domainParts.length + 1 && 
      parts[0] === 'www' && 
      parts.slice(1).join('.') === baseDomain) {
    return true
  }
  
  // Cualquier otra cosa es un subdominio tenant
  return false
}

/**
 * Extrae el subdominio tenant del hostname
 * @param hostname - El hostname de la request
 * @returns el subdominio o null si no es un tenant válido
 */
function extractTenantSubdomain(hostname: string | null): string | null {
  if (!hostname) return null
  
  const cleanHostname = hostname.split(':')[0]
  
  // Para desarrollo local, no hay tenants
  if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
    return null
  }
  
  const baseDomain = getBaseDomain()
  const parts = cleanHostname.split('.')
  const domainParts = baseDomain.split('.')
  
  // Para tenant.dominio.com, necesitamos una parte más que el dominio base
  if (parts.length === domainParts.length + 1 && 
      parts.slice(1).join('.') === baseDomain) {
    const subdomain = parts[0]
    
    // Evitar que www sea tratado como tenant
    if (subdomain === 'www') {
      return null
    }
    
    return subdomain
  }
  
  return null
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const pathname = request.nextUrl.pathname
  
  console.log(`🔍 Middleware: ${hostname}${pathname}`)
  
  // 1. Si es el dominio principal, permitir acceso normal
  if (isMainDomain(hostname)) {
    return NextResponse.next()
  }
  
  // 2. Si es un subdominio tenant, agregar headers con información del tenant
  const tenantSubdomain = extractTenantSubdomain(hostname)
  if (tenantSubdomain) {
    const response = NextResponse.next()
    response.headers.set('x-tenant-subdomain', tenantSubdomain)
    return response
  }
  
  // 3. Cualquier otra configuración, continuar normalmente
  return NextResponse.next()
}

// Configurar en qué rutas aplicar el middleware
export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas las rutas excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - public files (archivos públicos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}