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
    const isLoginPage = path === '/login';
    const isRootPage = path === '/';

    // If user is NOT authenticated:
    if (!user) {
        // If they are on a protected page (like root), redirect to login
        if (!isLoginPage && !path.startsWith('/_next') && !path.includes('.')) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        // If they are on login page, let them pass
        return response;
    }

    // 3. Authenticated User Logic
    if (user) {
        // 4. Role & Profile Verification
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Critical Fix: If user has a session but NO profile, they are "Ghost/Unauthorized" -> Force Login
        if (!profile) {
            if (!isLoginPage) {
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                return NextResponse.redirect(url)
            }
            // If they are on /login, let them stay there (don't redirect to home)
        } else {
            // User HAS a profile, so they are valid.
            const userRole = profile.role;

            // If they are on login page, send them home.
            if (isLoginPage) {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }

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
                if (userRole === 'şoför' && path === '/') {
                    const url = request.nextUrl.clone()
                    url.pathname = '/gunluk-program'
                    return NextResponse.redirect(url)
                }

                // General blocking for other restricted paths
                if (path !== '/') {
                    const url = request.nextUrl.clone()
                    url.pathname = '/'
                    return NextResponse.redirect(url)
                }
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
         * - public folder content
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
