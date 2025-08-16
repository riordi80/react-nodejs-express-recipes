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
  
  // SIEMPRE loggear para confirmar que se ejecuta
  console.log(`🔍 MIDDLEWARE EJECUTANDOSE: ${hostname}${pathname}`)
  
  // Verificación más simple: Si la ruta es /superadmin y no es console.*, bloquear
  if (pathname.startsWith('/superadmin')) {
    const cleanHostname = hostname?.split(':')[0] || ''
    console.log(`🔐 SuperAdmin detected - hostname: ${cleanHostname}`)
    
    // Si NO contiene "console" al principio, bloquear
    if (!cleanHostname.startsWith('console.')) {
      console.log(`❌ BLOCKING SuperAdmin - hostname does not start with console.`)
      return new NextResponse('<h1>404 - Not Found</h1>', { 
        status: 404,
        headers: { 'content-type': 'text/html' }
      })
    }
    
    console.log(`✅ ALLOWING SuperAdmin - console hostname detected`)
  }
  
  // 1. Si es el dominio principal, permitir acceso normal
  if (isMainDomain(hostname)) {
    console.log(`✅ Main domain detected: ${hostname}`)
    return NextResponse.next()
  }
  
  // 2. Si es un subdominio tenant, agregar headers
  const tenantSubdomain = extractTenantSubdomain(hostname)
  console.log(`🏢 Tenant subdomain: ${tenantSubdomain}`)
  
  if (tenantSubdomain) {
    // 2.1. Restricción inversa: en subdominio "console", solo permitir SuperAdmin y páginas públicas
    if (tenantSubdomain === 'console') {
      const allowedPaths = ['/superadmin', '/login', '/']
      const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path))
      console.log(`🎮 Console subdomain - path ${pathname} allowed: ${isAllowedPath}`)
      
      if (!isAllowedPath) {
        console.log(`❌ BLOCKING console access - path not allowed`)
        return new NextResponse('<h1>404 - Not Found</h1>', { 
          status: 404,
          headers: { 'content-type': 'text/html' }
        })
      }
    }
    
    // 2.2. Agregar headers con información del tenant
    const response = NextResponse.next()
    response.headers.set('x-tenant-subdomain', tenantSubdomain)
    return response
  }
  
  console.log(`⚠️ No tenant detected, allowing normal flow`)
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