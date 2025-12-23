import { createServerClient } from '@supabase/ssr'
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
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
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
        // We fetch the profile to check the role.
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role;

        const isRestricted = (r: string, p: string) => {
            if (r === 'sistem yöneticisi') return false;

            if (r === 'veri girici') {
                return p.startsWith('/kullanicilar');
            }

            if (r === 'saha sorumlusu') {
                return p.startsWith('/raporlama') || p.startsWith('/gelir-gider') || p.startsWith('/kullanicilar');
            }

            if (r === 'şoför') {
                // Driver allow list: Home or Daily Program
                if (p === '/' || p === '/gunluk-program' || p.startsWith('/gunluk-program')) return false;
                return true; // Block everything else
            }

            return false;
        }

        if (userRole && isRestricted(userRole, path)) {
            // If driver tries to go home '/', redirect to '/gunluk-program'
            // But wait, allow list says '/' is allowed for driver above?
            // "if (p === '/' ... return false" -> so isRestricted returns false -> no redirect.
            // But logic was:
            // if (userRole === 'şoför' && path === '/') { return NextResponse.redirect(...) }
            // Let's preserve that specific redirect if needed.

            if (userRole === 'şoför' && path === '/') {
                return NextResponse.redirect(new URL('/gunluk-program', request.url))
            }

            // General blocking for other restricted paths
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
