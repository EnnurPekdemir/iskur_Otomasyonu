using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Tracking;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class QrSessionConfiguration : IEntityTypeConfiguration<QrSession>
{
    public void Configure(EntityTypeBuilder<QrSession> builder)
    {
        builder.ToTable("QrSessions");

        builder.HasKey(q => q.Id);

        // Tek kullanımlık QR Token Hash (Tekil İndeks)
        builder.Property(q => q.TokenHash)
            .HasMaxLength(64)
            .IsUnicode(false)
            .IsRequired();

        builder.HasIndex(q => q.TokenHash)
            .IsUnique();

        builder.Property(q => q.DynamicNonce)
            .HasMaxLength(64)
            .IsUnicode(false);

        builder.Property(q => q.ExpiresAt)
            .IsRequired();

        builder.Property(q => q.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        // Oturumu Oluşturan Danışman/Yetkili
        builder.HasOne(q => q.CreatedByUser)
            .WithMany(u => u.CreatedQrSessions)
            .HasForeignKey(q => q.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bağlı Olduğu Birim (Opsiyonel)
        builder.HasOne(q => q.Unit)
            .WithMany(u => u.QrSessions)
            .HasForeignKey(q => q.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bu QR ile okutulan devam kayıtları
        builder.HasMany(q => q.Attendances)
            .WithOne(a => a.QrSession)
            .HasForeignKey(a => a.QrSessionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Hızlı doğrulama indeksi: Süresi dolmamış aktif QR oturumları
        builder.HasIndex(q => new { q.ExpiresAt, q.IsActive });
    }
}
