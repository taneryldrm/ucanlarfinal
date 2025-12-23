import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // 1. Get User
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // 2. Protect Authenticated Routes
    if (!user && path !== '/login' && !path.startsWith('/_next') && !path.includes('.')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. Authenticated User Logic
    if (user) {
        if (path === '/login') {
            return NextResponse.redirect(new URL('/', request.url))
        }

        // 4. Role-Based Access Control
        // Fetch role from profiles table (since user metadata might not be enough or up to date)
        // Note: Creating a client inside middleware can be tricky purely for data fetching if RLS is involved, 
        // but here we are 'server' side so we can use the supabase client we just created.

        // Ideally, we should cache this claim in metadata or cookie to avoid DB hit on every request,
        // but for now, let's fetch it. To avoid performance issues, consider standardizing claims.

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role;

        // We can't use the 'canAccessRoute' from lib/rbac.ts directly if it uses Node/Browser specifics? 
        // Actually nextjs middleware runs on Edge, so we need to be careful with imports.
        // 'lib/rbac.ts' is just data and logic, so it should be fine.

        // BUT we cannot import from modules that use 'fs' or other node APIs. 
        // Let's implement a simple check here or duplicate the logic if import fails.
        // Ideally, we import distinct 'rbac-rules.ts' that is edge compatible.
        // Currently 'lib/rbac.ts' has no dependencies, so it should work.

        // Manual check for now to ensure stability without complex imports if not verified
        /*
            Admin: *
            Data Entry: not /kullanicilar
            Field Supervisor: not /raporlama, /gelir-gider, /kullanicilar
            Driver: only /gunluk-program
        */

        const isRestricted = (r: string, p: string) => {
            if (r === 'sistem yöneticisi') return false;

            if (r === 'veri girici') {
                return p.startsWith('/kullanicilar');
            }

            if (r === 'saha sorumlusu') {
                return p.startsWith('/raporlama') || p.startsWith('/gelir-gider') || p.startsWith('/kullanicilar');
            }

            if (r === 'şoför') {
                // Driver allow list
                if (p === '/' || p === '/gunluk-program' || p.startsWith('/gunluk-program')) return false;
                return true; // Block everything else
            }

            return false;
        }

        if (userRole && isRestricted(userRole, path)) {
            // Redirect to a safe page or show 403
            // If driver tries to go home '/', redirect to '/gunluk-program'
            if (userRole === 'şoför' && path === '/') {
                return NextResponse.redirect(new URL('/gunluk-program', request.url))
            }

            // Otherwise redirect to home which might show "Unauthorized" or simple redirect
            if (path !== '/') {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
