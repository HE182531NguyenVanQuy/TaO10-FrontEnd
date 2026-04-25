# Cấu hình CORS và Kết nối Frontend Angular - Backend ASP.NET

## 1. CẤU HÌNH Backend (ASP.NET 8)

### 1.1 Cài đặt CORS trong Program.cs

```csharp
using Microsoft.AspNetCore.Cors;

var builder = WebApplicationBuilder.CreateBuilder(args);

// ===== CORS Configuration =====
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:4200", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", corsPolicy =>
    {
        corsPolicy
            .WithOrigins(corsOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ===== Middleware =====
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// USE CORS BEFORE AUTH
app.UseCors("AllowAngularApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

### 1.2 Cấu hình appsettings.json

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:4200",
      "http://localhost:3000",
      "https://yourdomain.com"
    ]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

### 1.3 Register API Endpoint (Example)

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Dữ liệu không hợp lệ",
                    errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList()
                });
            }

            var result = await _authService.RegisterAsync(request);

            if (!result.Success)
            {
                return result.StatusCode == 409 
                    ? Conflict(result)
                    : BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Register error");
            return StatusCode(500, new
            {
                success = false,
                message = "Có lỗi xảy ra. Vui lòng thử lại sau."
            });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

            var result = await _authService.LoginAsync(request);

            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error");
            return StatusCode(500, new
            {
                success = false,
                message = "Có lỗi xảy ra. Vui lòng thử lại sau."
            });
        }
    }
}
```

### 1.4 RegisterRequest & Response Models

```csharp
public class RegisterRequest
{
    [Required(ErrorMessage = "Tên không được để trống")]
    [StringLength(255)]
    public string FullName { get; set; }

    [Required(ErrorMessage = "Email không được để trống")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; }

    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^[0-9]{10,11}$", ErrorMessage = "Số điện thoại phải có 10-11 chữ số")]
    public string Phone { get; set; }

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [StringLength(255, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
    public string Password { get; set; }
}

public class RegisterResponse
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public RegisterData Data { get; set; }
    public Dictionary<string, string[]> Errors { get; set; }
}

public class RegisterData
{
    public Guid UserId { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
}
```

---

## 2. CẤU HÌNH Frontend (Angular)

### 2.1 Sửa AuthService - URL Backend

Mở file [src/app/services/auth.service.ts](src/app/services/auth.service.ts) và cập nhật URL:

```typescript
private apiUrl = 'http://localhost:5000/api'; // Thay đổi port theo backend của bạn
```

Hoặc tốt hơn, dùng environment config:

```typescript
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  // ...
}
```

### 2.2 Tạo Environment Config

**src/environments/environment.ts** (Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

**src/environments/environment.prod.ts** (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api'
};
```

### 2.3 AppConfig đã được cập nhật

File [src/app/app.config.ts](src/app/app.config.ts) đã được cập nhật với `provideHttpClient()`

### 2.4 RegisterComponent đã được cập nhật

File [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts):
- Đã import `AuthService`
- Đã sửa `onSubmit()` để gọi API
- Xử lý lỗi từ backend
- Chuyển hướng sau khi đăng ký thành công

---

## 3. CHẠY VÀ KIỂM TRA

### 3.1 Backend (ASP.NET)

```bash
cd TaO10-BackEnd
dotnet run
# Backend chạy trên http://localhost:5000
```

### 3.2 Frontend (Angular)

```bash
cd TaO10-FrontEnd
npm start
# Frontend chạy trên http://localhost:4200
```

### 3.3 Test Đăng Ký

1. Mở browser → http://localhost:4200
2. Nhấn nút "Đăng ký miễn phí" → Trang register
3. Điền thông tin:
   - Họ và tên: `Nguyễn Văn A`
   - Email: `a@example.com`
   - Số điện thoại: `0912345678`
   - Mật khẩu: `123456`
   - Xác nhận mật khẩu: `123456`
4. Nhấn "Tạo tài khoản"
5. Mở **Browser DevTools** (F12) → **Network tab** để xem request/response

---

## 4. KIỂM TRA ERROR HANDLING

### Network Error
- Tắt backend → Thấy message "Lỗi kết nối"

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "Email": ["Email không hợp lệ"],
    "Phone": ["Số điện thoại phải có 10-11 chữ số"]
  }
}
```

### Conflict Error (409)
```json
{
  "success": false,
  "message": "Email hoặc số điện thoại đã được sử dụng"
}
```

### Success (200)
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "a@example.com",
    "fullName": "Nguyễn Văn A"
  }
}
```

---

## 5. TROUBLESHOOTING

### CORS Error trong Console
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/register' 
from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Giải pháp**: Kiểm tra lại `UseCors()` trong Program.cs - phải gọi TRƯỚC `UseAuthentication()`

### 401 Unauthorized
- Backend yêu cầu token nhưng Angular không gửi
- Giải pháp: Tạo HTTP Interceptor để thêm token vào header

### 404 Not Found
- URL API sai
- Kiểm tra: Route controller, method name, port backend

---

## 6. TẠO HTTP INTERCEPTOR (Optional)

**src/app/services/auth.interceptor.ts**

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
```

**app.config.ts**
```typescript
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};
```

---

## 7. FILES ĐÃ ĐƯỢC CẬP NHẬT

✅ `src/app/services/auth.service.ts` - Service gọi API
✅ `src/app/pages/register/register.component.ts` - Component sử dụng service
✅ `src/app/pages/register/register.component.html` - Form có trường phone
✅ `src/app/app.config.ts` - Provider HttpClient
✅ `src/app/layout/header/header.component.html` - Button register dùng routerLink

---

Bây giờ Angular và ASP.NET có thể giao tiếp với nhau! 🚀
